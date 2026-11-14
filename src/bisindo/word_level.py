"""Word-level BISINDO (WL-BISINDO v3) feature extraction and TFLite inference.

Matches KawanIsyarat's `kaggle_bisindo_wl.py` / `GestureService` pipeline:
  - 100 raw floats per frame (nose-centered):
      [0:42]   Right hand 21 x (x, y)
      [42:84]  Left hand  21 x (x, y)
      [84:98]  7 pose anchors x (x, y): nose, L/R shoulder, L/R ear, L/R elbow
      [98]     has_right_hand (1.0 or NaN)
      [99]     has_left_hand  (1.0 or NaN)
  - Resample variable-length frame sequence to 30 frames
  - Per-sequence std normalization: `(x - nanmean) / max(nanstd, 1e-6)` -> NaN to 0
  - Temporal derivatives: `[pos, vel, acc]` -> `(30, 300)` where
      `vel[1:] = x[1:] - x[:-1]` and `acc[2:] = x[2:] - x[:-2]`
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Sequence

import cv2
import mediapipe as mp
import numpy as np
import tensorflow as tf

from bisindo.landmarks import detect_raw_hands, ensure_task_asset

WL_SEQUENCE_LEN = 30
WL_RAW_FEATURE_DIM = 100
WL_TEMPORAL_FEATURE_DIM = WL_RAW_FEATURE_DIM * 3  # 300

POSE_NOSE = 0
POSE_L_EAR = 7
POSE_R_EAR = 8
POSE_L_SHOULDER = 11
POSE_R_SHOULDER = 12
POSE_L_ELBOW = 13
POSE_R_ELBOW = 14
POSE_ANCHOR_IDX = [
    POSE_NOSE,
    POSE_L_SHOULDER,
    POSE_R_SHOULDER,
    POSE_L_EAR,
    POSE_R_EAR,
    POSE_L_ELBOW,
    POSE_R_ELBOW,
]

POSE_TASK_URL = (
    "https://storage.googleapis.com/mediapipe-models/"
    "pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task"
)
DEFAULT_POSE_TASK_PATH = Path("artifacts/mediapipe/pose_landmarker_lite.task")


@dataclass(frozen=True)
class WordPrediction:
    word: str
    confidence: float


def create_pose_detector(
    min_detection_confidence: float = 0.3,
    min_tracking_confidence: float = 0.3,
    model_asset_path: str | Path = DEFAULT_POSE_TASK_PATH,
) -> Any:
    """Create a MediaPipe PoseLandmarker using the Tasks API."""
    from mediapipe.tasks.python import vision
    from mediapipe.tasks.python.core.base_options import BaseOptions

    task_file = ensure_task_asset(model_asset_path, POSE_TASK_URL)
    options = vision.PoseLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=str(task_file)),
        running_mode=vision.RunningMode.IMAGE,
        min_pose_detection_confidence=min_detection_confidence,
        min_tracking_confidence=min_tracking_confidence,
    )
    return vision.PoseLandmarker.create_from_options(options)


def detect_raw_pose(bgr_image: np.ndarray, pose_detector: Any) -> list[Any] | None:
    """Extract first detected pose's 33 landmarks from a BGR image."""
    rgb = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2RGB)
    if hasattr(pose_detector, "detect"):
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        results = pose_detector.detect(mp_image)
        if not results.pose_landmarks:
            return None
        return list(results.pose_landmarks[0])

    rgb.flags.writeable = False
    results = pose_detector.process(rgb)
    if not getattr(results, "pose_landmarks", None):
        return None
    return list(results.pose_landmarks.landmark)


def anatomical_is_right(landmarks: Sequence[Any]) -> bool:
    """Determine anatomical right-hand vs left-hand from palm landmark geometry."""
    w = landmarks[0]
    i5 = landmarks[5]
    p17 = landmarks[17]
    t4 = landmarks[4]
    p20 = landmarks[20]

    cross_z = (i5.x - w.x) * (p17.y - w.y) - (i5.y - w.y) * (p17.x - w.x)
    thumb_vs_pinky = t4.x - p20.x
    return (cross_z >= 0 and thumb_vs_pinky <= 0) or (cross_z < 0 and thumb_vs_pinky > 0)


def extract_wl_frame_features(
    hand_landmarks_list: Sequence[Sequence[Any]],
    pose_landmarks: Sequence[Any] | None,
) -> np.ndarray:
    """Build a 100-float nose-centered frame feature vector (NaN for missing parts)."""
    out = np.full(WL_RAW_FEATURE_DIM, np.nan, dtype=np.float32)
    nose_x, nose_y = 0.5, 0.5

    if pose_landmarks:
        nose_x = float(pose_landmarks[POSE_NOSE].x)
        nose_y = float(pose_landmarks[POSE_NOSE].y)
        for i, idx in enumerate(POSE_ANCHOR_IDX):
            out[84 + i * 2] = float(pose_landmarks[idx].x) - nose_x
            out[84 + i * 2 + 1] = float(pose_landmarks[idx].y) - nose_y

    has_right = False
    has_left = False
    for hand_lms in hand_landmarks_list:
        if len(hand_lms) < 21:
            continue
        is_right = anatomical_is_right(hand_lms)
        base = 0 if is_right else 42
        if is_right:
            has_right = True
        else:
            has_left = True
        for j, lm in enumerate(hand_lms[:21]):
            out[base + j * 2] = float(lm.x) - nose_x
            out[base + j * 2 + 1] = float(lm.y) - nose_y

    out[98] = 1.0 if has_right else np.nan
    out[99] = 1.0 if has_left else np.nan
    return out


def extract_wl_features_from_bgr(
    bgr_image: np.ndarray,
    hand_detector: Any,
    pose_detector: Any,
) -> np.ndarray:
    """Detect hands + pose from a BGR frame and return 100-float WL features."""
    raw_hands = detect_raw_hands(bgr_image, hand_detector)
    raw_pose = detect_raw_pose(bgr_image, pose_detector)
    return extract_wl_frame_features(raw_hands, raw_pose)


def resample_sequence(
    frames: Sequence[np.ndarray],
    target_len: int = WL_SEQUENCE_LEN,
) -> np.ndarray:
    """Uniformly resample a variable-length list of 100-dim frames to `(target_len, 100)`."""
    if not frames:
        return np.zeros((target_len, WL_RAW_FEATURE_DIM), dtype=np.float32)
    indices = np.linspace(0, len(frames) - 1, target_len, dtype=int)
    return np.stack([frames[i] for i in indices], axis=0).astype(np.float32)


def normalize_sequence_std(seq: np.ndarray) -> np.ndarray:
    """Apply per-sequence `(x - nanmean) / max(nanstd, 1e-6)` normalization and zero NaNs."""
    arr = np.asarray(seq, dtype=np.float32)
    if np.all(np.isnan(arr)):
        return np.zeros_like(arr, dtype=np.float32)
    mean = float(np.nanmean(arr))
    std = float(np.nanstd(arr))
    if not np.isfinite(std) or std < 1e-6:
        std = 1.0
    norm = (arr - mean) / std
    return np.nan_to_num(norm, nan=0.0, posinf=0.0, neginf=0.0).astype(np.float32)


def add_temporal_derivatives(seq_norm: np.ndarray) -> np.ndarray:
    """Compute position + velocity + acceleration along time -> `(*, 300)`."""
    arr = np.asarray(seq_norm, dtype=np.float32)
    vel = np.zeros_like(arr)
    acc = np.zeros_like(arr)
    vel[..., 1:, :] = arr[..., 1:, :] - arr[..., :-1, :]
    acc[..., 2:, :] = arr[..., 2:, :] - arr[..., :-2, :]
    return np.concatenate([arr, vel, acc], axis=-1).astype(np.float32)


def prepare_wl_model_input(
    frames: Sequence[np.ndarray],
    sequence_len: int = WL_SEQUENCE_LEN,
) -> np.ndarray:
    """Convert raw 100-dim frame features into `[1, sequence_len, 300]` model input."""
    resampled = resample_sequence(frames, target_len=sequence_len)
    normalized = normalize_sequence_std(resampled)
    deriv = add_temporal_derivatives(normalized)
    return deriv[np.newaxis, ...].astype(np.float32)


class WordLevelPredictor:
    """TFLite wrapper for KawanIsyarat's WL-BISINDO word-level gesture model."""

    def __init__(self, tflite_path: str | Path, labels_path: str | Path) -> None:
        raw_labels = json.loads(Path(labels_path).read_text(encoding="utf-8"))
        i2l = raw_labels["index_to_label"]
        self.index_to_label: dict[int, str] = {int(k): str(v) for k, v in i2l.items()}
        self.sequence_len = int(raw_labels.get("sequence_len", WL_SEQUENCE_LEN))

        self.interpreter = tf.lite.Interpreter(model_path=str(tflite_path))
        self.interpreter.allocate_tensors()
        self._input_idx = self.interpreter.get_input_details()[0]["index"]
        self._output_idx = self.interpreter.get_output_details()[0]["index"]

    def predict(self, frames: Sequence[np.ndarray]) -> list[WordPrediction]:
        """Run inference on a sequence of raw 100-dim frames and return sorted predictions."""
        model_input = prepare_wl_model_input(frames, sequence_len=self.sequence_len)
        self.interpreter.set_tensor(self._input_idx, model_input)
        self.interpreter.invoke()
        scores = self.interpreter.get_tensor(self._output_idx)[0]

        preds = [
            WordPrediction(word=self.index_to_label[i], confidence=float(scores[i]))
            for i in range(len(scores))
        ]
        preds.sort(key=lambda p: p.confidence, reverse=True)
        return preds
