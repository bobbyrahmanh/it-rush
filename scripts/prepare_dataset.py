"""Extract 86-dim BISINDO landmarks from a folder of class-labeled images and videos.

Supports optional YOLO `.txt` hand bounding boxes for fallback cropping (e.g. Agung Ma'ruf dataset),
video sampling, incremental `--append` saving, and `--allow-new-classes`.
"""

from __future__ import annotations

import argparse
from collections import Counter
from pathlib import Path

import yaml

from bisindo.dataset import (
    append_landmarks_npz,
    extract_dataset_from_directory,
    save_landmarks_npz,
)
from bisindo.landmarks import create_hands_detector


def _find_yolo_label_file(img_path: Path, input_dir: Path) -> Path | None:
    same_dir = img_path.with_suffix(".txt")
    if same_dir.exists():
        return same_dir

    rel = img_path.relative_to(input_dir)
    candidates = [
        input_dir.parent / "labels" / rel.with_suffix(".txt"),
        input_dir / "labels" / rel.with_suffix(".txt"),
        img_path.parent.parent / "labels" / img_path.parent.name / f"{img_path.stem}.txt",
    ]
    for cand in candidates:
        if cand.exists():
            return cand
    return None


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Prepare BISINDO landmark NPZ from image/video folders"
    )
    parser.add_argument("--config", type=Path, default=Path("configs/config.yaml"))
    parser.add_argument("--input-dir", type=Path, default=None, help="Override raw_images_dir")
    parser.add_argument("--output", type=Path, default=None, help="Override public_npz")
    parser.add_argument(
        "--append",
        action="store_true",
        help="Append extracted samples to existing NPZ instead of overwriting",
    )
    parser.add_argument(
        "--allow-new-classes",
        action="store_true",
        help="Extract all subfolder names as classes, including classes not in config.yaml",
    )
    parser.add_argument(
        "--frame-stride",
        type=int,
        default=3,
        help="Sample every Nth frame when reading video files",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    cfg = yaml.safe_load(args.config.read_text(encoding="utf-8"))
    classes = set(cfg["classes"])
    input_dir = args.input_dir or Path(cfg["paths"]["raw_images_dir"])
    output_path = args.output or Path(cfg["paths"]["public_npz"])

    if not input_dir.exists():
        raise FileNotFoundError(f"Input directory not found: {input_dir}")

    detector = create_hands_detector(static_image_mode=True, min_detection_confidence=0.3)
    try:
        X, y, groups, discovered = extract_dataset_from_directory(
            input_dir=input_dir,
            classes=classes,
            detector=detector,
            allow_new_classes=args.allow_new_classes,
            frame_stride=args.frame_stride,
            find_yolo_fn=_find_yolo_label_file,
        )
    finally:
        detector.close()

    if len(X) == 0:
        raise RuntimeError("No hand landmarks extracted from any image or video.")

    counts = Counter(y.tolist())
    for label in discovered:
        print(f"[{label}] extracted {counts[label]} samples")

    if args.append:
        total = append_landmarks_npz(output_path, X, y, groups=groups)
        print(f"Appended {len(X)} samples to {output_path} (total={total})")
    else:
        save_landmarks_npz(output_path, X, y, groups=groups)
        print(f"Saved {len(X)} samples to {output_path}")


if __name__ == "__main__":
    main()
