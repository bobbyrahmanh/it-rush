"""MediaPipe Hands landmark extraction into 86-dim BISINDO features."""

from __future__ import annotations

import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import cv2
import mediapipe as mp
import numpy as np

from bisindo.features import (
    NUM_LANDMARKS,
    build_single_hand_features,
    build_two_hand_features,
)

HAND_TASK_URL = (
    "https://storage.googleapis.com/mediapipe-models/"
    "hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task"
)
DEFAULT_HAND_TASK_PATH = Path("artifacts/mediapipe/hand_landmarker.task")


@dataclass(frozen=True)
class HandExtractionResult:
    features: np.ndarray | None
    num_hands: int
    hands_xy: list[np.ndarray]


def ensure_task_asset(path: str | Path, url: str) -> Path:
    """Ensure a MediaPipe `.task` bundle exists locally, downloading it if absent."""
    asset_path = Path(path)
    if not asset_path.exists():
        asset_path.parent.mkdir(parents=True, exist_ok=True)
        urllib.request.urlretrieve(url, asset_path)
    return asset_path


def create_hands_detector(
    static_image_mode: bool = True,
    min_detection_confidence: float = 0.3,
    min_tracking_confidence: float = 0.3,
    model_asset_path: str | Path = DEFAULT_HAND_TASK_PATH,
) -> Any:
    """Create a MediaPipe Hands detector (Tasks API on mediapipe>=1.0, solutions fallback)."""
    if hasattr(mp, "tasks"):
        from mediapipe.tasks.python import vision
        from mediapipe.tasks.python.core.base_options import BaseOptions

        task_file = ensure_task_asset(model_asset_path, HAND_TASK_URL)
        options = vision.HandLandmarkerOptions(
            base_options=BaseOptions(model_asset_path=str(task_file)),
            running_mode=vision.RunningMode.IMAGE,
            num_hands=2,
            min_hand_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence,
        )
        return vision.HandLandmarker.create_from_options(options)

    return mp.solutions.hands.Hands(
        static_image_mode=static_image_mode,
        max_num_hands=2,
        min_detection_confidence=min_detection_confidence,
        min_tracking_confidence=min_tracking_confidence,
    )


def _features_from_hands_xy(hands_xy: list[np.ndarray]) -> HandExtractionResult:
    if not hands_xy:
        return HandExtractionResult(features=None, num_hands=0, hands_xy=[])
    if len(hands_xy) >= 2:
        features = build_two_hand_features(hands_xy[0], hands_xy[1])
    else:
        features = build_single_hand_features(hands_xy[0])
    return HandExtractionResult(
        features=features,
        num_hands=len(hands_xy),
        hands_xy=hands_xy,
    )


def detect_raw_hands(bgr_image: np.ndarray, detector: Any) -> list[list[Any]]:
    """Run either Tasks `HandLandmarker.detect` or legacy/mock `.process` on BGR image."""
    rgb = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2RGB)
    if hasattr(detector, "detect"):
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        results = detector.detect(mp_image)
        return list(results.hand_landmarks or [])

    rgb.flags.writeable = False
    results = detector.process(rgb)
    if not getattr(results, "multi_hand_landmarks", None):
        return []
    return [list(h.landmark) for h in results.multi_hand_landmarks]


def extract_features_from_bgr(
    bgr_image: np.ndarray,
    detector: Any,
) -> HandExtractionResult:
    """Detect up to 2 hands in a BGR image and build an 86-dim feature vector."""
    raw_hands = detect_raw_hands(bgr_image, detector)
    if not raw_hands:
        return HandExtractionResult(features=None, num_hands=0, hands_xy=[])

    hands_xy: list[np.ndarray] = []
    for hand_lms in raw_hands[:2]:
        pts = np.array(
            [[lm.x, lm.y] for lm in hand_lms[:NUM_LANDMARKS]],
            dtype=np.float32,
        )
        hands_xy.append(pts)

    return _features_from_hands_xy(hands_xy)


def parse_yolo_boxes(label_path: str | Path) -> list[tuple[float, float, float, float]]:
    """Parse normalized YOLO `(cx, cy, w, h)` bounding boxes from a `.txt` label file."""
    path = Path(label_path)
    if not path.exists():
        return []

    boxes: list[tuple[float, float, float, float]] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        parts = line.strip().split()
        if len(parts) < 5:
            continue
        cx, cy, w, h = (float(parts[1]), float(parts[2]), float(parts[3]), float(parts[4]))
        if w > 0.0 and h > 0.0:
            boxes.append((cx, cy, w, h))
    return boxes


def crop_with_yolo_boxes(
    bgr_image: np.ndarray,
    boxes: list[tuple[float, float, float, float]],
    pad_ratio: float = 0.20,
) -> tuple[np.ndarray, tuple[float, float, float, float]]:
    """Crop the padded union of normalized YOLO bounding boxes from `bgr_image`.

    Returns `(cropped_bgr, (x0_norm, y0_norm, w_norm, h_norm))`.
    """
    if not boxes:
        raise ValueError("boxes must be non-empty")

    img_h, img_w = bgr_image.shape[:2]
    x_mins = [cx - w / 2.0 for cx, _, w, _ in boxes]
    y_mins = [cy - h / 2.0 for _, cy, _, h in boxes]
    x_maxs = [cx + w / 2.0 for cx, _, w, _ in boxes]
    y_maxs = [cy + h / 2.0 for _, cy, _, h in boxes]

    ux0, uy0 = min(x_mins), min(y_mins)
    ux1, uy1 = max(x_maxs), max(y_maxs)
    pad_x = (ux1 - ux0) * pad_ratio
    pad_y = (uy1 - uy0) * pad_ratio

    nx0 = max(0.0, ux0 - pad_x)
    ny0 = max(0.0, uy0 - pad_y)
    nx1 = min(1.0, ux1 + pad_x)
    ny1 = min(1.0, uy1 + pad_y)

    px0 = max(0, min(img_w - 1, int(round(nx0 * img_w))))
    py0 = max(0, min(img_h - 1, int(round(ny0 * img_h))))
    px1 = max(px0 + 1, min(img_w, int(round(nx1 * img_w))))
    py1 = max(py0 + 1, min(img_h, int(round(ny1 * img_h))))

    cropped = bgr_image[py0:py1, px0:px1]
    roi = (px0 / img_w, py0 / img_h, (px1 - px0) / img_w, (py1 - py0) / img_h)
    return cropped, roi


def extract_features_with_yolo_fallback(
    bgr_image: np.ndarray,
    detector: Any,
    yolo_boxes: list[tuple[float, float, float, float]] | None = None,
    pad_ratio: float = 0.20,
) -> HandExtractionResult:
    """Run MediaPipe on the full image, falling back to YOLO hand-box cropping if needed."""
    full_res = extract_features_from_bgr(bgr_image, detector)
    expected_two = bool(yolo_boxes and len(yolo_boxes) >= 2)
    needs_fallback = full_res.features is None or (expected_two and full_res.num_hands < 2)

    if not needs_fallback or not yolo_boxes:
        return full_res

    cropped, (x0, y0, w_norm, h_norm) = crop_with_yolo_boxes(
        bgr_image, yolo_boxes, pad_ratio=pad_ratio
    )
    crop_res = extract_features_from_bgr(cropped, detector)
    if crop_res.num_hands <= full_res.num_hands:
        return full_res

    mapped_hands: list[np.ndarray] = []
    for pts in crop_res.hands_xy:
        mapped = pts.copy()
        mapped[:, 0] = x0 + mapped[:, 0] * w_norm
        mapped[:, 1] = y0 + mapped[:, 1] * h_norm
        mapped_hands.append(mapped)

    return _features_from_hands_xy(mapped_hands)
