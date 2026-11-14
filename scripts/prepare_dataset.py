"""Extract 86-dim BISINDO landmarks from a folder of class-labeled images.

Supports optional YOLO `.txt` hand bounding boxes for fallback cropping (e.g. Agung Ma'ruf dataset),
stored either next to each image or in a sibling `labels/` directory, and computes anti-leakage
group IDs via `extract_base_group_id`.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import cv2
import numpy as np
import yaml

from bisindo.dataset import extract_base_group_id, save_landmarks_npz
from bisindo.landmarks import (
    create_hands_detector,
    extract_features_with_yolo_fallback,
    parse_yolo_boxes,
)

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}


def _find_yolo_label_file(img_path: Path, input_dir: Path) -> Path | None:
    same_dir = img_path.with_suffix(".txt")
    if same_dir.exists():
        return same_dir

    # Check common sibling labels/ structures:
    #   <root>/images/<CLASS>/<name>.jpg -> <root>/labels/<CLASS>/<name>.txt
    #   <root>/<CLASS>/<name>.jpg        -> <root>/labels/<CLASS>/<name>.txt
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
    parser = argparse.ArgumentParser(description="Prepare BISINDO landmark NPZ from image folders")
    parser.add_argument("--config", type=Path, default=Path("configs/config.yaml"))
    parser.add_argument("--input-dir", type=Path, default=None, help="Override raw_images_dir")
    parser.add_argument("--output", type=Path, default=None, help="Override public_npz")
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
    X_list: list[np.ndarray] = []
    y_list: list[str] = []
    groups_list: list[str] = []
    skipped = 0
    yolo_used = 0

    try:
        for class_dir in sorted(input_dir.iterdir()):
            if not class_dir.is_dir():
                continue
            label = class_dir.name.upper()
            if label not in classes:
                print(f"[SKIP] Unknown class folder: {class_dir.name}")
                continue

            images = [p for p in sorted(class_dir.iterdir()) if p.suffix.lower() in IMAGE_EXTS]
            kept = 0
            for img_path in images:
                bgr = cv2.imread(str(img_path))
                if bgr is None:
                    skipped += 1
                    continue

                label_file = _find_yolo_label_file(img_path, input_dir)
                yolo_boxes = parse_yolo_boxes(label_file) if label_file else None
                if yolo_boxes:
                    yolo_used += 1

                res = extract_features_with_yolo_fallback(bgr, detector, yolo_boxes=yolo_boxes)
                if res.features is None:
                    skipped += 1
                    continue

                X_list.append(res.features)
                y_list.append(label)
                groups_list.append(f"{label}_{extract_base_group_id(img_path.name)}")
                kept += 1

            print(f"[{label}] extracted {kept}/{len(images)} images")
    finally:
        detector.close()

    if not X_list:
        raise RuntimeError("No hand landmarks extracted from any image.")

    X = np.stack(X_list, axis=0)
    y = np.array(y_list, dtype=str)
    groups = np.array(groups_list, dtype=str)
    save_landmarks_npz(output_path, X, y, groups=groups)
    print(
        f"Saved {len(X)} samples to {output_path} "
        f"(skipped={skipped}, yolo_annotations_found={yolo_used})"
    )


if __name__ == "__main__":
    main()
