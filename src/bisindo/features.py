"""Bohacek hand landmark normalization and 86-dim BISINDO feature builder.

Matches KawanIsyarat's `BisindoAlphabetService` feature layout:
  [0:42]   Leftmost / first hand (21 x (x, y) Bohacek-normalized to [0, 1])
  [42:84]  Rightmost / second hand (21 x (x, y) Bohacek-normalized, or zeros)
  [84]     dx = mean_x(right) - mean_x(left) (always >= 0 for two hands, 0.0 for single)
  [85]     dy = mean_y(right) - mean_y(left) (0.0 for single)
"""

from __future__ import annotations

import numpy as np

NUM_LANDMARKS = 21
NUM_HAND_FEATURES = NUM_LANDMARKS * 2  # 42
FEATURE_DIM = NUM_HAND_FEATURES * 2 + 2  # 86
_EPS = 1e-6


def _validate_hand_coords(coords: np.ndarray) -> np.ndarray:
    arr = np.asarray(coords, dtype=np.float32)
    if arr.shape == (NUM_HAND_FEATURES,):
        arr = arr.reshape(NUM_LANDMARKS, 2)
    elif arr.shape != (NUM_LANDMARKS, 2):
        raise ValueError(
            f"Expected hand coords shape ({NUM_LANDMARKS}, 2) or ({NUM_HAND_FEATURES},), got {arr.shape}"
        )
    return arr


def normalize_hand_bohacek(coords: np.ndarray) -> np.ndarray:
    """Apply Bohacek bounding-box normalization to 21 (x, y) landmarks.

    Returns a new flat float32 array of length 42 with values in [0, 1].
    """
    pts = _validate_hand_coords(coords)
    min_xy = pts.min(axis=0)
    max_xy = pts.max(axis=0)
    span = np.maximum(np.abs(max_xy - min_xy), _EPS)

    norm = (pts - min_xy) / span
    return norm.astype(np.float32).reshape(NUM_HAND_FEATURES)


def build_two_hand_features(hand_a: np.ndarray, hand_b: np.ndarray) -> np.ndarray:
    """Build 86-dim feature vector from two hands, sorted left-to-right by mean x."""
    pts_a = _validate_hand_coords(hand_a)
    pts_b = _validate_hand_coords(hand_b)

    cx_a = float(pts_a[:, 0].mean())
    cx_b = float(pts_b[:, 0].mean())
    left_pts, right_pts = (pts_a, pts_b) if cx_a <= cx_b else (pts_b, pts_a)

    left_norm = normalize_hand_bohacek(left_pts)
    right_norm = normalize_hand_bohacek(right_pts)

    dx = np.float32(right_pts[:, 0].mean() - left_pts[:, 0].mean())
    dy = np.float32(right_pts[:, 1].mean() - left_pts[:, 1].mean())

    return np.concatenate([left_norm, right_norm, np.array([dx, dy], dtype=np.float32)])


def build_single_hand_features(hand: np.ndarray) -> np.ndarray:
    """Build 86-dim feature vector from a single hand (zero-pads second slot)."""
    pts = _validate_hand_coords(hand)
    hand_norm = normalize_hand_bohacek(pts)
    zeros = np.zeros(NUM_HAND_FEATURES + 2, dtype=np.float32)
    return np.concatenate([hand_norm, zeros])


def _is_second_hand_present(features: np.ndarray) -> bool:
    return bool(np.any(np.abs(features[NUM_HAND_FEATURES : NUM_HAND_FEATURES * 2]) > _EPS))


def flip_and_swap_features(features: np.ndarray) -> np.ndarray:
    """Horizontally flip x-coordinates (x -> 1 - x) and swap hand slots.

    Preserves the invariant that slot 1 is the leftmost hand (dx >= 0).
    Returns a new array without mutating `features`.
    """
    feat = np.asarray(features, dtype=np.float32).copy()
    if feat.shape != (FEATURE_DIM,):
        raise ValueError(f"Expected feature shape ({FEATURE_DIM},), got {feat.shape}")

    if not _is_second_hand_present(feat):
        feat[0:NUM_HAND_FEATURES:2] = 1.0 - feat[0:NUM_HAND_FEATURES:2]
        return feat

    left = feat[0:NUM_HAND_FEATURES].copy()
    right = feat[NUM_HAND_FEATURES : NUM_HAND_FEATURES * 2].copy()

    left[0::2] = 1.0 - left[0::2]
    right[0::2] = 1.0 - right[0::2]

    dx = feat[84]
    dy = -feat[85]
    return np.concatenate([right, left, np.array([dx, dy], dtype=np.float32)])


def make_single_hand_fallback(features: np.ndarray, keep: str = "left") -> np.ndarray:
    """Drop one hand slot and zero-pad slot 2 to simulate overlapping-hand occlusion."""
    feat = np.asarray(features, dtype=np.float32)
    if feat.shape != (FEATURE_DIM,):
        raise ValueError(f"Expected feature shape ({FEATURE_DIM},), got {feat.shape}")

    if keep == "left":
        kept = feat[0:NUM_HAND_FEATURES].copy()
    elif keep == "right":
        kept = feat[NUM_HAND_FEATURES : NUM_HAND_FEATURES * 2].copy()
    else:
        raise ValueError(f"keep must be 'left' or 'right', got {keep!r}")

    zeros = np.zeros(NUM_HAND_FEATURES + 2, dtype=np.float32)
    return np.concatenate([kept, zeros])


def add_landmark_jitter(
    features: np.ndarray,
    std: float = 0.015,
    rng: np.random.Generator | None = None,
) -> np.ndarray:
    """Add Gaussian jitter to active hand landmark slots and clip to [0, 1].

    Returns a new array without mutating `features`.
    """
    if rng is None:
        rng = np.random.default_rng()

    out = np.asarray(features, dtype=np.float32).copy()
    if out.shape != (FEATURE_DIM,):
        raise ValueError(f"Expected feature shape ({FEATURE_DIM},), got {out.shape}")

    noise1 = rng.normal(0.0, std, size=NUM_HAND_FEATURES).astype(np.float32)
    out[0:NUM_HAND_FEATURES] = np.clip(out[0:NUM_HAND_FEATURES] + noise1, 0.0, 1.0)

    if _is_second_hand_present(out):
        noise2 = rng.normal(0.0, std, size=NUM_HAND_FEATURES).astype(np.float32)
        out[NUM_HAND_FEATURES : NUM_HAND_FEATURES * 2] = np.clip(
            out[NUM_HAND_FEATURES : NUM_HAND_FEATURES * 2] + noise2, 0.0, 1.0
        )
        out[84] = np.float32(max(0.0, out[84] + float(rng.normal(0.0, std * 0.5))))
        out[85] = np.float32(out[85] + float(rng.normal(0.0, std * 0.5)))

    return out
