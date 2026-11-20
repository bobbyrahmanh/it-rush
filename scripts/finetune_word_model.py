"""Extract word video clips (with augmentation) and fine-tune the WL-BISINDO classifier head."""

from __future__ import annotations

import argparse
from collections import Counter
import json
from pathlib import Path
import shutil
from typing import Any

import cv2
import numpy as np
import yaml

from bisindo.dataset import VIDEO_EXTS
from bisindo.landmarks import create_hands_detector, detect_raw_hands
from bisindo.word_level import (
    POSE_ANCHOR_IDX,
    WL_SEQUENCE_LEN,
    WordLevelPredictor,
    append_wl_sequences_npz,
    augment_wl_raw_frames,
    create_pose_detector,
    detect_raw_pose,
    export_wl_browser_weights,
    extract_wl_frame_features,
    finetune_wl_head_in_place,
    load_wl_sequences_npz,
    prepare_wl_model_input,
    save_wl_sequences_npz,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Extract word-level BISINDO video sequences and fine-tune WL classifier head"
    )
    parser.add_argument("--config", type=Path, default=Path("configs/config.yaml"))
    parser.add_argument(
        "--video-dir",
        type=Path,
        default=None,
        help="Optional directory containing <word_label>/<clip>.mp4 videos to extract",
    )
    parser.add_argument("--wl-npz", type=Path, default=None, help="Override WL NPZ path")
    parser.add_argument(
        "--overwrite-npz",
        action="store_true",
        help="Overwrite WL NPZ instead of appending when --video-dir is provided",
    )
    parser.add_argument(
        "--augment-per-class",
        type=int,
        default=0,
        help="Number of synthetic augmented sequences to add per word class from raw frames",
    )
    parser.add_argument(
        "--reset-classes",
        nargs="*",
        default=[],
        help="Word labels whose classifier head weights should be reset rather than anchored to old weights",
    )
    parser.add_argument(
        "--sim-sequences-out",
        type=Path,
        default=Path("public/samples/bisindo/wl_sequences.json"),
        help="Output JSON path for clean 30-frame browser skeleton simulation",
    )
    parser.add_argument("--epochs", type=int, default=None)
    parser.add_argument("--lr", type=float, default=None)
    parser.add_argument("--l2-sp-alpha", type=float, default=None)
    parser.add_argument(
        "--no-sync-public",
        action="store_true",
        help="Do not copy updated WL TFLite, labels, or browser weights to public/models/bisindo/",
    )
    return parser.parse_args()


def _load_wl_classes(labels_path: Path) -> list[str]:
    payload = json.loads(labels_path.read_text(encoding="utf-8"))
    i2l = payload["index_to_label"]
    return [str(i2l[str(i)]) for i in range(len(i2l))]


def _extract_visual_frames_from_video(
    video_path: Path,
    hand_detector: Any,
    pose_detector: Any,
    *,
    crop_start: float = 0.0,
) -> tuple[list[np.ndarray], list[dict[str, Any]], int]:
    """Read video once, returning `(raw_100_frames, resampled_30_sim_frames, two_hand_hits)`."""
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise RuntimeError(f"Could not open video file: {video_path}")

    bgr_frames: list[np.ndarray] = []
    try:
        while True:
            ok, frame = cap.read()
            if not ok:
                break
            bgr_frames.append(frame)
    finally:
        cap.release()

    if not bgr_frames:
        raise ValueError(f"Video file contained no readable frames: {video_path}")

    raw_frames: list[np.ndarray] = []
    all_visual: list[dict[str, Any]] = []
    for frame in bgr_frames:
        raw_hands = detect_raw_hands(frame, hand_detector)
        raw_pose = detect_raw_pose(frame, pose_detector)
        raw_frames.append(extract_wl_frame_features(raw_hands, raw_pose))

        hands_out = [
            [[round(float(lm.x), 4), round(float(lm.y), 4)] for lm in hand_lms[:21]]
            for hand_lms in raw_hands[:2]
        ]
        pose_out = (
            [
                [round(float(raw_pose[idx].x), 4), round(float(raw_pose[idx].y), 4)]
                for idx in POSE_ANCHOR_IDX
            ]
            if raw_pose
            else None
        )
        all_visual.append({"hands": hands_out, "pose": pose_out})

    n = len(all_visual)
    i0 = max(0, min(n - min(n, 8), int(round(crop_start * n))))
    sub_visual = all_visual[i0:]
    sim_idx = np.linspace(0, len(sub_visual) - 1, WL_SEQUENCE_LEN, dtype=int)
    sim_frames = [sub_visual[int(k)] for k in sim_idx]
    two_hand_hits = sum(1 for f in sim_frames if len(f["hands"]) >= 2)
    return raw_frames, sim_frames, two_hand_hits


def _extract_from_video_dir(
    video_dir: Path,
    allowed_words: list[str],
    out_npz: Path,
    *,
    augment_per_class: int = 0,
    overwrite: bool = False,
    seed: int = 42,
    sim_sequences_out: Path | None = None,
) -> tuple[list[tuple[str, str, list[np.ndarray]]], dict[str, list[dict[str, Any]]]]:
    if not video_dir.exists():
        raise FileNotFoundError(f"Video directory not found: {video_dir}")

    allowed_set = set(allowed_words)
    hand_det = create_hands_detector(static_image_mode=True, min_detection_confidence=0.3)
    pose_det = create_pose_detector(min_detection_confidence=0.3)

    clean_clips: list[tuple[str, str, list[np.ndarray]]] = []
    best_sim_by_word: dict[str, tuple[int, list[dict[str, Any]]]] = {}

    try:
        for word_dir in sorted(video_dir.iterdir()):
            if not word_dir.is_dir():
                continue
            word = word_dir.name.lower()
            if word not in allowed_set:
                print(
                    f"[SKIP] Word folder '{word_dir.name}' not in WL labels: {sorted(allowed_set)}"
                )
                continue
            for vid_path in sorted(word_dir.iterdir()):
                if not vid_path.is_file() or vid_path.suffix.lower() not in VIDEO_EXTS:
                    continue
                raw_frames, sim_frames, two_hits = _extract_visual_frames_from_video(
                    vid_path,
                    hand_det,
                    pose_det,
                    crop_start=(0.25 if word == "pantai" and len(vid_path.stem) > 0 else 0.0),
                )
                clean_clips.append((word, vid_path.name, raw_frames))
                hand_hits = sum(1 for f in sim_frames if len(f["hands"]) >= 1)
                pose_hits = sum(1 for f in sim_frames if f["pose"] is not None)
                score = two_hits * 3 + hand_hits * 2 + pose_hits
                prev_score = best_sim_by_word[word][0] if word in best_sim_by_word else -1
                if score > prev_score:
                    best_sim_by_word[word] = (score, sim_frames)
    finally:
        hand_det.close()
        pose_det.close()

    if not clean_clips:
        raise RuntimeError(f"No readable videos extracted from {video_dir}")

    rng = np.random.default_rng(seed)
    seqs: list[np.ndarray] = []
    labels: list[str] = []
    groups: list[str] = []

    clips_by_word: dict[str, list[tuple[str, list[np.ndarray]]]] = {}
    for word, vname, raw_frames in clean_clips:
        clips_by_word.setdefault(word, []).append((vname, raw_frames))
        seqs.append(prepare_wl_model_input(raw_frames)[0])
        labels.append(word)
        groups.append(f"{word}_{Path(vname).stem}")

    if augment_per_class > 0:
        for word in allowed_words:
            w_clips = clips_by_word.get(word, [])
            if not w_clips:
                continue
            for aug_i in range(augment_per_class):
                vname, raw_frames = w_clips[aug_i % len(w_clips)]
                aug_raw = augment_wl_raw_frames(
                    raw_frames,
                    rng=rng,
                    mirror=bool(rng.random() < 0.5),
                    x_scale=float(rng.uniform(0.55, 1.45)),
                    y_scale=float(rng.uniform(0.85, 1.15)),
                    rot_deg=float(rng.uniform(-10.0, 10.0)),
                    crop_start=float(rng.uniform(0.0, 0.30)),
                    crop_end=float(rng.uniform(0.82, 1.0)),
                    noise_std=0.008,
                )
                seqs.append(prepare_wl_model_input(aug_raw)[0])
                labels.append(word)
                groups.append(f"{word}_{Path(vname).stem}_aug{aug_i}")

    X_arr = np.stack(seqs, axis=0)
    y_arr = np.array(labels, dtype=str)
    g_arr = np.array(groups, dtype=str)
    if overwrite or not out_npz.exists():
        save_wl_sequences_npz(out_npz, X_arr, y_arr, groups=g_arr)
        print(f"Saved {len(X_arr)} WL sequences ({len(clean_clips)} clean) to {out_npz}")
    else:
        total = append_wl_sequences_npz(out_npz, X_arr, y_arr, groups_new=g_arr)
        print(f"Appended {len(X_arr)} WL sequences to {out_npz} (total={total})")

    sim_map: dict[str, list[dict[str, Any]]] = {}
    if sim_sequences_out is not None:
        if sim_sequences_out.exists():
            existing_sim = json.loads(sim_sequences_out.read_text(encoding="utf-8"))
        else:
            existing_sim = {}
        for word in allowed_words:
            if word in best_sim_by_word:
                sim_map[word] = best_sim_by_word[word][1]
            elif word in existing_sim:
                sim_map[word] = existing_sim[word]
        sim_sequences_out.parent.mkdir(parents=True, exist_ok=True)
        sim_sequences_out.write_text(json.dumps(sim_map, separators=(",", ":")), encoding="utf-8")
        print(f"Updated simulation skeleton JSON ({list(sim_map.keys())}) -> {sim_sequences_out}")

    return clean_clips, sim_map


def main() -> None:
    args = parse_args()
    cfg = yaml.safe_load(args.config.read_text(encoding="utf-8"))
    paths = cfg["paths"]
    f_cfg = cfg["finetuning"]

    wl_tflite = Path(paths["wl_tflite_model"])
    wl_labels = Path(paths["wl_labels_json"])
    wl_npz = args.wl_npz or Path(paths["wl_npz"])
    classes = _load_wl_classes(wl_labels)

    clean_clips: list[tuple[str, str, list[np.ndarray]]] = []
    sim_out = None if args.no_sync_public else args.sim_sequences_out
    if args.video_dir is not None:
        clean_clips, _ = _extract_from_video_dir(
            args.video_dir,
            classes,
            wl_npz,
            augment_per_class=args.augment_per_class,
            overwrite=args.overwrite_npz,
            seed=f_cfg["seed"],
            sim_sequences_out=sim_out,
        )

    if not wl_npz.exists():
        raise FileNotFoundError(
            f"WL NPZ not found at {wl_npz}. Provide --video-dir to extract clips first."
        )

    X_seq, y_str, _ = load_wl_sequences_npz(wl_npz)
    print(f"Fine-tuning WL head on {len(X_seq)} sequences: {dict(Counter(y_str.tolist()))}")

    acc = finetune_wl_head_in_place(
        base_tflite_path=wl_tflite,
        classes=classes,
        X_seq=X_seq,
        y_labels=y_str,
        output_tflite_path=wl_tflite,
        epochs=args.epochs if args.epochs is not None else f_cfg.get("wl_epochs", 40),
        learning_rate=args.lr if args.lr is not None else f_cfg.get("wl_learning_rate", 1e-3),
        l2_sp_alpha=(
            args.l2_sp_alpha if args.l2_sp_alpha is not None else f_cfg["l2_sp_alpha"]
        ),
        reset_classes=args.reset_classes,
        seed=f_cfg["seed"],
    )
    print(f"WL training-set accuracy: {acc:.4%} -> {wl_tflite}")

    if clean_clips:
        predictor = WordLevelPredictor(wl_tflite, wl_labels)
        clean_ok = 0
        print("\n=== Clean Video Evaluation ===")
        for word, vname, raw_frames in clean_clips:
            preds = predictor.predict(raw_frames)
            top = preds[0]
            ok = top.word == word
            if ok:
                clean_ok += 1
            print(f"  [{ 'OK' if ok else 'MISS' }] {word:13s} ({vname}) -> {top.word} ({top.confidence:.1%})")
        print(f"Clean clip accuracy: {clean_ok}/{len(clean_clips)} ({clean_ok / len(clean_clips):.2%})")

    if not args.no_sync_public and paths.get("public_models_dir"):
        pub_dir = Path(paths["public_models_dir"])
        pub_dir.mkdir(parents=True, exist_ok=True)
        pub_wl = pub_dir / wl_tflite.name
        if pub_wl.resolve() != wl_tflite.resolve():
            shutil.copy2(wl_tflite, pub_wl)
        pub_labels = pub_dir / wl_labels.name
        if pub_labels.resolve() != wl_labels.resolve():
            shutil.copy2(wl_labels, pub_labels)
        export_wl_browser_weights(wl_tflite, pub_dir)
        print(f"Synced WL TFLite, labels, wl_model.json & wl_weights.bin -> {pub_dir}")


if __name__ == "__main__":
    main()
