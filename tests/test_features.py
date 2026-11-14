import numpy as np
import pytest

from bisindo.features import (
    FEATURE_DIM,
    NUM_HAND_FEATURES,
    NUM_LANDMARKS,
    add_landmark_jitter,
    build_single_hand_features,
    build_two_hand_features,
    flip_and_swap_features,
    make_single_hand_fallback,
    normalize_hand_bohacek,
)


def _make_hand(x_offset: float, y_offset: float, scale: float = 0.2) -> np.ndarray:
    """Create synthetic (21, 2) hand landmarks in [0, 1] space."""
    rng = np.random.default_rng(42)
    pts = rng.uniform(0.0, 1.0, size=(NUM_LANDMARKS, 2)).astype(np.float32)
    pts[:, 0] = x_offset + pts[:, 0] * scale
    pts[:, 1] = y_offset + pts[:, 1] * scale
    return pts


def test_normalize_hand_bohacek_range():
    hand = _make_hand(0.2, 0.3, scale=0.25)
    norm = normalize_hand_bohacek(hand)

    assert norm.shape == (NUM_HAND_FEATURES,)
    assert norm.dtype == np.float32
    assert np.isclose(norm[0::2].min(), 0.0, atol=1e-6)
    assert np.isclose(norm[0::2].max(), 1.0, atol=1e-6)
    assert np.isclose(norm[1::2].min(), 0.0, atol=1e-6)
    assert np.isclose(norm[1::2].max(), 1.0, atol=1e-6)


def test_normalize_hand_bohacek_degenerate_zero_span():
    hand = np.full((NUM_LANDMARKS, 2), 0.5, dtype=np.float32)
    norm = normalize_hand_bohacek(hand)

    assert norm.shape == (NUM_HAND_FEATURES,)
    assert np.all(np.isfinite(norm))
    assert np.allclose(norm, 0.0)


def test_build_two_hand_features_sorts_left_to_right():
    left_hand = _make_hand(0.1, 0.3, scale=0.2)
    right_hand = _make_hand(0.6, 0.4, scale=0.2)

    # Pass right_hand first to verify automatic left-to-right sorting
    feat_rl = build_two_hand_features(right_hand, left_hand)
    feat_lr = build_two_hand_features(left_hand, right_hand)

    assert feat_rl.shape == (FEATURE_DIM,)
    assert np.allclose(feat_rl, feat_lr)
    # dx = right_cx - left_cx must be >= 0
    assert feat_rl[84] >= 0.0


def test_build_single_hand_features_zero_pads_second_slot():
    hand = _make_hand(0.4, 0.4, scale=0.2)
    feat = build_single_hand_features(hand)

    assert feat.shape == (FEATURE_DIM,)
    assert np.allclose(feat[42:84], 0.0)
    assert feat[84] == 0.0
    assert feat[85] == 0.0


def test_flip_and_swap_features_preserves_dx_non_negative_and_does_not_mutate():
    left_hand = _make_hand(0.15, 0.25, scale=0.2)
    right_hand = _make_hand(0.65, 0.45, scale=0.2)
    feat = build_two_hand_features(left_hand, right_hand)
    feat_copy = feat.copy()

    flipped = flip_and_swap_features(feat)

    assert np.array_equal(feat, feat_copy)  # immutability
    assert flipped.shape == (FEATURE_DIM,)
    # After horizontal flip + swap, dx remains >= 0 and dy is negated
    assert np.isclose(flipped[84], feat[84], atol=1e-6)
    assert np.isclose(flipped[85], -feat[85], atol=1e-6)
    # Slot 1 x-coords of flipped == 1 - slot 2 x-coords of original
    assert np.allclose(flipped[0:42:2], 1.0 - feat[42:84:2], atol=1e-6)
    assert np.allclose(flipped[1:42:2], feat[43:84:2], atol=1e-6)


def test_make_single_hand_fallback_zeroes_second_hand():
    left_hand = _make_hand(0.15, 0.25, scale=0.2)
    right_hand = _make_hand(0.65, 0.45, scale=0.2)
    feat = build_two_hand_features(left_hand, right_hand)
    orig = feat.copy()

    single = make_single_hand_fallback(feat, keep="left")
    assert np.array_equal(feat, orig)
    assert np.allclose(single[0:42], feat[0:42])
    assert np.allclose(single[42:86], 0.0)

    single_r = make_single_hand_fallback(feat, keep="right")
    assert np.allclose(single_r[0:42], feat[42:84])
    assert np.allclose(single_r[42:86], 0.0)


def test_add_landmark_jitter_does_not_mutate_and_keeps_zeros():
    hand = _make_hand(0.4, 0.4, scale=0.2)
    feat = build_single_hand_features(hand)
    orig = feat.copy()

    rng = np.random.default_rng(123)
    jittered = add_landmark_jitter(feat, std=0.02, rng=rng)

    assert np.array_equal(feat, orig)
    assert not np.allclose(jittered[:42], feat[:42])
    # Second hand slot (single-hand zero padding) stays zero
    assert np.allclose(jittered[42:86], 0.0)
    assert jittered[:42].min() >= 0.0
    assert jittered[:42].max() <= 1.0
