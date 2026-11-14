"""Extract word video clips (optional) and fine-tune the WL-BISINDO classifier head."""

from __future__ import annotations

import argparse
from collections import Counter
import json
from pathlib import Path
import shutil

import numpy as np
import yaml

from bisindo.dataset import VIDEO_EXTS
from bisindo.landmarks import create_hands_detector
from bisindo.word_level import (
    append_wl_sequences_npz,
    create_pose_detector,
    extract_wl_sequence_from_video_file,
    finetune_wl_head_in_place,
    load_wl_sequences_npz,
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
    parser.add_argument("--epochs", type=int, default=None)
    parser.add_argument("--lr", type=float, default=None)
    parser.add_argument("--l2-sp-alpha", type=float, default=None)
    parser.add_argument(
        "--no-sync-public",
        action="store_true",
        help="Do not copy updated WL TFLite model to public/models/bisindo/",
    )
    return parser.parse_args()


def _load_wl_classes(labels_path: Path) -> list[str]:
    payload = json.loads(labels_path.read_text(encoding="utf-8"))
    i2l = payload["index_to_label"]
    return [str(i2l[str(i)]) for i in range(len(i2l))]


def _extract_from_video_dir(
    video_dir: Path,
    allowed_words: set[str],
    out_npz: Path,
    *,
    overwrite: bool = False,
) -> None:
    if not video_dir.exists():
        raise FileNotFoundError(f"Video directory not found: {video_dir}")

    hand_det = create_hands_detector(static_image_mode=True, min_detection_confidence=0.3)
    pose_det = create_pose_detector(min_detection_confidence=0.3)
    seqs: list[np.ndarray] = []
    labels: list[str] = []
    groups: list[str] = []

    try:
        for word_dir in sorted(video_dir.iterdir()):
            if not word_dir.is_dir():
                continue
            word = word_dir.name.lower()
            if word not in allowed_words:
                print(f"[SKIP] Word folder '{word_dir.name}' not in WL labels: {sorted(allowed_words)}")
                continue
            for vid_path in sorted(word_dir.iterdir()):
                if not vid_path.is_file() or vid_path.suffix.lower() not in VIDEO_EXTS:
                    continue
                seq = extract_wl_sequence_from_video_file(vid_path, hand_det, pose_det)
                seqs.append(seq)
                labels.append(word)
                groups.append(f"{word}_{vid_path.stem}")
    finally:
        hand_det.close()
        pose_det.close()

    if not seqs:
        raise RuntimeError(f"No readable videos extracted from {video_dir}")

    X_arr = np.stack(seqs, axis=0)
    y_arr = np.array(labels, dtype=str)
    g_arr = np.array(groups, dtype=str)
    if overwrite or not out_npz.exists():
        save_wl_sequences_npz(out_npz, X_arr, y_arr, groups=g_arr)
        print(f"Saved {len(X_arr)} WL sequences to {out_npz}")
    else:
        total = append_wl_sequences_npz(out_npz, X_arr, y_arr, groups_new=g_arr)
        print(f"Appended {len(X_arr)} WL sequences to {out_npz} (total={total})")


def main() -> None:
    args = parse_args()
    cfg = yaml.safe_load(args.config.read_text(encoding="utf-8"))
    paths = cfg["paths"]
    f_cfg = cfg["finetuning"]

    wl_tflite = Path(paths["wl_tflite_model"])
    wl_labels = Path(paths["wl_labels_json"])
    wl_npz = args.wl_npz or Path(paths["wl_npz"])
    classes = _load_wl_classes(wl_labels)

    if args.video_dir is not None:
        _extract_from_video_dir(
            args.video_dir,
            set(classes),
            wl_npz,
            overwrite=args.overwrite_npz,
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
        seed=f_cfg["seed"],
    )
    print(f"WL post-finetuning accuracy: {acc:.4%} -> {wl_tflite}")

    if not args.no_sync_public and paths.get("public_models_dir"):
        pub_wl = Path(paths["public_models_dir"]) / wl_tflite.name
        pub_wl.parent.mkdir(parents=True, exist_ok=True)
        if pub_wl.resolve() != wl_tflite.resolve():
            shutil.copy2(wl_tflite, pub_wl)
        print(f"Synced WL TFLite to {pub_wl}")


if __name__ == "__main__":
    main()
