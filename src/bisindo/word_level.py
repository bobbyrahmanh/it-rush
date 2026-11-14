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


def extract_wl_sequence_from_video_file(
    video_path: str | Path,
    hand_detector: Any,
    pose_detector: Any,
    sequence_len: int = WL_SEQUENCE_LEN,
) -> np.ndarray:
    """Extract a `(sequence_len, 300)` WL-BISINDO input tensor from a video clip."""
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise RuntimeError(f"Could not open video file: {video_path}")

    raw_frames: list[np.ndarray] = []
    try:
        while True:
            ok, frame = cap.read()
            if not ok:
                break
            raw_frames.append(extract_wl_features_from_bgr(frame, hand_detector, pose_detector))
    finally:
        cap.release()

    if not raw_frames:
        raise ValueError(f"Video file contained no readable frames: {video_path}")
    return prepare_wl_model_input(raw_frames, sequence_len=sequence_len)[0]


def save_wl_sequences_npz(
    path: str | Path,
    X_seq: np.ndarray,
    labels: np.ndarray,
    groups: np.ndarray | None = None,
) -> Path:
    """Save `(N, 30, 300)` WL sequences, string word labels, and optional groups to NPZ."""
    out_path = Path(path)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    X_arr = np.asarray(X_seq, dtype=np.float32)
    y_arr = np.asarray(labels, dtype=str)
    if (
        X_arr.ndim != 3
        or X_arr.shape[1] != WL_SEQUENCE_LEN
        or X_arr.shape[2] != WL_TEMPORAL_FEATURE_DIM
    ):
        raise ValueError(
            f"Expected X_seq shape (N, {WL_SEQUENCE_LEN}, {WL_TEMPORAL_FEATURE_DIM}), got {X_arr.shape}"
        )
    if len(X_arr) != len(y_arr):
        raise ValueError(f"Mismatched lengths: X_seq={len(X_arr)}, labels={len(y_arr)}")

    payload: dict[str, np.ndarray] = {"X": X_arr, "y": y_arr}
    if groups is not None:
        g_arr = np.asarray(groups, dtype=str)
        if len(g_arr) != len(X_arr):
            raise ValueError(f"Mismatched lengths: X_seq={len(X_arr)}, groups={len(g_arr)}")
        payload["groups"] = g_arr

    np.savez_compressed(out_path, **payload)
    return out_path


def load_wl_sequences_npz(
    path: str | Path,
) -> tuple[np.ndarray, np.ndarray, np.ndarray | None]:
    """Load `(N, 30, 300)` WL sequences, string labels, and optional group IDs from NPZ."""
    data = np.load(Path(path), allow_pickle=False)
    X = data["X"].astype(np.float32)
    y = data["y"].astype(str)
    groups = data["groups"].astype(str) if "groups" in data.files else None
    return X, y, groups


def append_wl_sequences_npz(
    path: str | Path,
    X_new: np.ndarray,
    labels_new: np.ndarray,
    groups_new: np.ndarray | None = None,
) -> int:
    """Append new `(N, 30, 300)` word sequences to an existing WL NPZ (or create it)."""
    out_path = Path(path)
    X_arr = np.asarray(X_new, dtype=np.float32)
    y_arr = np.asarray(labels_new, dtype=str)

    if (
        X_arr.ndim != 3
        or X_arr.shape[1] != WL_SEQUENCE_LEN
        or X_arr.shape[2] != WL_TEMPORAL_FEATURE_DIM
    ):
        raise ValueError(
            f"Expected X_new shape (N, {WL_SEQUENCE_LEN}, {WL_TEMPORAL_FEATURE_DIM}), got {X_arr.shape}"
        )
    if len(X_arr) != len(y_arr):
        raise ValueError(f"Mismatched lengths: X_new={len(X_arr)}, labels_new={len(y_arr)}")

    if out_path.exists():
        X_old, y_old, g_old = load_wl_sequences_npz(out_path)
        existing_n = len(X_old)
        if len(X_arr) == 0:
            return existing_n
        if g_old is None:
            g_old = np.array([f"old_{i}" for i in range(existing_n)], dtype=str)
        if groups_new is None:
            g_new = np.array(
                [f"append_{existing_n}_{i}" for i in range(len(X_arr))], dtype=str
            )
        else:
            g_new = np.asarray(groups_new, dtype=str)
        X_all = np.concatenate([X_old, X_arr], axis=0)
        y_all = np.concatenate([y_old, y_arr], axis=0)
        g_all = np.concatenate([g_old, g_new], axis=0)
    else:
        if groups_new is None:
            g_all = np.array([f"append_0_{i}" for i in range(len(X_arr))], dtype=str)
        else:
            g_all = np.asarray(groups_new, dtype=str)
        X_all, y_all = X_arr, y_arr

    save_wl_sequences_npz(out_path, X_all, y_all, groups=g_all)
    return len(X_all)


def extract_wl_backbone_embeddings(
    tflite_path: str | Path,
    X_seq: np.ndarray,
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Run WL Conformer backbone and extract penultimate 128-dim GAP embeddings + head weights."""
    X_arr = np.asarray(X_seq, dtype=np.float32)
    if X_arr.ndim != 3 or X_arr.shape[1] != WL_SEQUENCE_LEN or X_arr.shape[2] != WL_TEMPORAL_FEATURE_DIM:
        raise ValueError(
            f"Expected X_seq shape (N, {WL_SEQUENCE_LEN}, {WL_TEMPORAL_FEATURE_DIM}), got {X_arr.shape}"
        )

    interpreter = tf.lite.Interpreter(
        model_path=str(tflite_path),
        experimental_op_resolver_type=tf.lite.experimental.OpResolverType.BUILTIN_WITHOUT_DEFAULT_DELEGATES,
        experimental_preserve_all_tensors=True,
    )
    interpreter.allocate_tensors()

    ops = interpreter._get_ops_details()
    fc_ops = [op for op in ops if op["op_name"] == "FULLY_CONNECTED"]
    if not fc_ops:
        raise ValueError(f"No FULLY_CONNECTED ops found in {tflite_path}")

    final_fc = fc_ops[-1]
    gap_idx = int(final_fc["inputs"][0])
    weight_idx = int(final_fc["inputs"][1])
    bias_idx = int(final_fc["inputs"][2]) if len(final_fc["inputs"]) > 2 else -1

    in_idx = interpreter.get_input_details()[0]["index"]
    w_head = interpreter.get_tensor(weight_idx).astype(np.float32).copy()
    b_head = (
        interpreter.get_tensor(bias_idx).astype(np.float32).copy()
        if bias_idx >= 0
        else np.zeros((w_head.shape[0],), dtype=np.float32)
    )

    emb_list: list[np.ndarray] = []
    for seq in X_arr:
        interpreter.set_tensor(in_idx, seq[np.newaxis, ...])
        interpreter.invoke()
        emb_list.append(interpreter.get_tensor(gap_idx)[0].astype(np.float32).copy())

    embeddings = np.stack(emb_list, axis=0)
    return embeddings, w_head, b_head


def finetune_wl_head_in_place(
    base_tflite_path: str | Path,
    classes: list[str],
    X_seq: np.ndarray,
    y_labels: np.ndarray,
    output_tflite_path: str | Path,
    *,
    epochs: int = 40,
    learning_rate: float = 1e-3,
    l2_sp_alpha: float = 1e-2,
    seed: int = 42,
) -> float:
    """Fine-tune the final WL-BISINDO classifier head with L2-SP and patch the TFLite binary."""
    from sklearn.utils.class_weight import compute_class_weight

    from bisindo.model import L2SPRegularizer

    label_to_idx = {label: idx for idx, label in enumerate(classes)}
    y_str = [str(lbl) for lbl in y_labels]
    unknown = sorted({lbl for lbl in y_str if lbl not in label_to_idx})
    if unknown:
        raise ValueError(f"Unknown WL class labels: {unknown}. Allowed: {classes}")
    if len(X_seq) == 0:
        raise ValueError("X_seq must contain at least one sequence")

    y_idx = np.array([label_to_idx[lbl] for lbl in y_str], dtype=np.int64)
    raw_bytes = Path(base_tflite_path).read_bytes()

    embeddings, w0_tflite, b0_tflite = extract_wl_backbone_embeddings(base_tflite_path, X_seq)
    if w0_tflite.shape[0] != len(classes):
        raise ValueError(
            f"WL model outputs {w0_tflite.shape[0]} classes, expected {len(classes)}"
        )

    tf.keras.utils.set_random_seed(seed)
    w0_keras = w0_tflite.T.copy()

    inp = tf.keras.Input(shape=(embeddings.shape[1],), dtype=tf.float32)
    dense = tf.keras.layers.Dense(
        units=len(classes),
        activation="softmax",
        use_bias=True,
        kernel_regularizer=L2SPRegularizer(w0_keras, l2_sp_alpha) if l2_sp_alpha > 0.0 else None,
        bias_regularizer=L2SPRegularizer(b0_tflite, l2_sp_alpha) if l2_sp_alpha > 0.0 else None,
    )
    out = dense(inp)
    head_model = tf.keras.Model(inputs=inp, outputs=out)
    dense.set_weights([w0_keras.copy(), b0_tflite.copy()])

    head_model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=learning_rate),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )

    unique_cls = np.unique(y_idx)
    weights = compute_class_weight("balanced", classes=unique_cls, y=y_idx)
    class_weight = {int(c): float(w) for c, w in zip(unique_cls, weights)}

    head_model.fit(
        embeddings,
        y_idx,
        epochs=epochs,
        batch_size=min(16, len(embeddings)),
        class_weight=class_weight,
        verbose=1,
    )

    present_set = set(unique_cls.tolist())
    w_new_keras, b_new = dense.get_weights()
    for c in range(len(classes)):
        if c not in present_set:
            w_new_keras[:, c] = w0_keras[:, c]
            b_new[c] = b0_tflite[c]

    w_new_bytes = w_new_keras.T.astype("<f4").tobytes()
    b_new_bytes = b_new.astype("<f4").tobytes()
    old_w_bytes = w0_tflite.astype("<f4").tobytes()
    old_b_bytes = b0_tflite.astype("<f4").tobytes()

    if raw_bytes.count(old_w_bytes) != 1 or raw_bytes.count(old_b_bytes) != 1:
        raise RuntimeError(
            "Could not uniquely locate WL classifier head weights inside TFLite binary."
        )

    w_off = raw_bytes.index(old_w_bytes)
    b_off = raw_bytes.index(old_b_bytes)
    patched = bytearray(raw_bytes)
    patched[w_off : w_off + len(old_w_bytes)] = w_new_bytes
    patched[b_off : b_off + len(old_b_bytes)] = b_new_bytes
    out_path = Path(output_tflite_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_bytes(bytes(patched))

    # Evaluate patched TFLite model end-to-end on input sequences
    eval_interp = tf.lite.Interpreter(model_path=str(out_path))
    eval_interp.allocate_tensors()
    e_in = eval_interp.get_input_details()[0]["index"]
    e_out = eval_interp.get_output_details()[0]["index"]
    correct = 0
    for seq, target in zip(X_seq, y_idx):
        eval_interp.set_tensor(e_in, seq[np.newaxis, ...].astype(np.float32))
        eval_interp.invoke()
        pred = int(np.argmax(eval_interp.get_tensor(e_out)[0]))
        if pred == int(target):
            correct += 1
    return float(correct / len(y_idx))
