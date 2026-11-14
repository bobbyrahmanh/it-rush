from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock

import cv2
import numpy as np
import pytest

from bisindo.word_level import (
    WL_RAW_FEATURE_DIM,
    WL_SEQUENCE_LEN,
    WL_TEMPORAL_FEATURE_DIM,
    WordLevelPredictor,
    add_temporal_derivatives,
    anatomical_is_right,
    append_wl_sequences_npz,
    create_pose_detector,
    detect_raw_pose,
    extract_wl_backbone_embeddings,
    extract_wl_features_from_bgr,
    extract_wl_frame_features,
    extract_wl_sequence_from_video_file,
    finetune_wl_head_in_place,
    load_wl_sequences_npz,
    normalize_sequence_std,
    prepare_wl_model_input,
    resample_sequence,
    save_wl_sequences_npz,
)


def _make_hand_lms(
    wrist_x: float = 0.5,
    wrist_y: float = 0.6,
    thumb_x: float = 0.4,
    pinky_x: float = 0.6,
    finger_y: float = 0.55,
):
    pts = [SimpleNamespace(x=wrist_x, y=wrist_y) for _ in range(21)]
    pts[4] = SimpleNamespace(x=thumb_x, y=finger_y - 0.05)  # thumb tip
    pts[5] = SimpleNamespace(x=thumb_x, y=finger_y)         # index MCP
    pts[17] = SimpleNamespace(x=pinky_x, y=finger_y)        # pinky MCP
    pts[20] = SimpleNamespace(x=pinky_x, y=finger_y - 0.05) # pinky tip
    return pts


def _make_pose_lms():
    pts = [SimpleNamespace(x=0.5, y=0.3) for _ in range(33)]
    pts[0] = SimpleNamespace(x=0.5, y=0.25)   # nose
    pts[11] = SimpleNamespace(x=0.6, y=0.45)  # left shoulder
    pts[12] = SimpleNamespace(x=0.4, y=0.45)  # right shoulder
    return pts


def test_extract_wl_frame_features_layout_and_presence_flags():
    # Right-slot hand (upright: cross_z < 0, thumb_vs_pinky > 0 -> anatomical_is_right == True)
    hand_slot_r = _make_hand_lms(wrist_x=0.3, wrist_y=0.6, thumb_x=0.38, pinky_x=0.22, finger_y=0.55)
    # Left-slot hand (downward: cross_z > 0, thumb_vs_pinky > 0 -> anatomical_is_right == False)
    hand_slot_l = _make_hand_lms(wrist_x=0.7, wrist_y=0.4, thumb_x=0.78, pinky_x=0.62, finger_y=0.50)
    pose = _make_pose_lms()

    assert anatomical_is_right(hand_slot_r) is True
    assert anatomical_is_right(hand_slot_l) is False

    feat = extract_wl_frame_features([hand_slot_r, hand_slot_l], pose)
    assert feat.shape == (WL_RAW_FEATURE_DIM,)
    # Nose centered -> feat[84:86] == (0, 0)
    assert np.allclose(feat[84:86], 0.0)
    # Both hands present
    assert feat[98] == 1.0
    assert feat[99] == 1.0


def test_extract_wl_features_from_bgr_with_mock_detectors():
    hand_det = MagicMock(spec=["detect"])
    hand_det.detect.return_value = SimpleNamespace(
        hand_landmarks=[
            _make_hand_lms(wrist_x=0.3, wrist_y=0.6, thumb_x=0.38, pinky_x=0.22, finger_y=0.55)
        ]
    )
    pose_det = MagicMock(spec=["detect"])
    pose_det.detect.return_value = SimpleNamespace(pose_landmarks=[_make_pose_lms()])

    img = np.zeros((100, 100, 3), dtype=np.uint8)
    feat = extract_wl_features_from_bgr(img, hand_det, pose_det)

    assert feat.shape == (WL_RAW_FEATURE_DIM,)
    assert feat[98] == 1.0
    assert np.isnan(feat[99])


def test_resample_normalize_and_temporal_derivatives():
    raw_frames = [
        np.full(WL_RAW_FEATURE_DIM, float(i), dtype=np.float32) for i in range(15)
    ]
    raw_frames[0][98] = np.nan

    resampled = resample_sequence(raw_frames, target_len=WL_SEQUENCE_LEN)
    assert resampled.shape == (WL_SEQUENCE_LEN, WL_RAW_FEATURE_DIM)

    norm = normalize_sequence_std(resampled)
    assert norm.shape == (WL_SEQUENCE_LEN, WL_RAW_FEATURE_DIM)
    assert np.all(np.isfinite(norm))
    assert norm[0, 98] == 0.0

    deriv = add_temporal_derivatives(norm)
    assert deriv.shape == (WL_SEQUENCE_LEN, WL_TEMPORAL_FEATURE_DIM)
    assert np.allclose(deriv[1, 100:200], norm[1] - norm[0])
    assert np.allclose(deriv[2, 200:300], norm[2] - norm[0])

    # Empty input returns zero sequence safely
    assert np.allclose(resample_sequence([]), 0.0)


def test_word_level_predictor_runs_kawanisyarat_tflite():
    model_path = Path("artifacts/bisindo_wl_model.tflite")
    labels_path = Path("artifacts/bisindo_wl_labels.json")
    if not model_path.exists():
        pytest.skip("bisindo_wl_model.tflite not downloaded")

    predictor = WordLevelPredictor(model_path, labels_path)
    rng = np.random.default_rng(7)
    frames = [rng.normal(0.0, 0.2, size=WL_RAW_FEATURE_DIM).astype(np.float32) for _ in range(20)]

    model_input = prepare_wl_model_input(frames)
    assert model_input.shape == (1, WL_SEQUENCE_LEN, WL_TEMPORAL_FEATURE_DIM)

    preds = predictor.predict(frames)
    assert len(preds) == 8
    assert np.isclose(sum(p.confidence for p in preds), 1.0, atol=1e-4)
    assert preds[0].confidence >= preds[-1].confidence


def test_create_pose_detector_runs_on_blank_image():
    task_file = Path("artifacts/mediapipe/pose_landmarker_lite.task")
    if not task_file.exists():
        pytest.skip("pose_landmarker_lite.task not downloaded")

    detector = create_pose_detector(model_asset_path=task_file)
    try:
        img = np.zeros((128, 128, 3), dtype=np.uint8)
        assert detect_raw_pose(img, detector) is None
    finally:
        detector.close()


def test_save_load_and_append_wl_sequences_npz(tmp_path):
    rng = np.random.default_rng(5)
    X1 = rng.normal(0.0, 0.2, size=(2, WL_SEQUENCE_LEN, WL_TEMPORAL_FEATURE_DIM)).astype(np.float32)
    y1 = np.array(["air", "makan"])
    npz_path = tmp_path / "wl.npz"

    save_wl_sequences_npz(npz_path, X1, y1)
    X2 = rng.normal(0.0, 0.2, size=(2, WL_SEQUENCE_LEN, WL_TEMPORAL_FEATURE_DIM)).astype(np.float32)
    y2 = np.array(["saya", "tuli"])
    total = append_wl_sequences_npz(npz_path, X2, y2)

    assert total == 4
    X_loaded, y_loaded, g_loaded = load_wl_sequences_npz(npz_path)
    assert X_loaded.shape == (4, WL_SEQUENCE_LEN, WL_TEMPORAL_FEATURE_DIM)
    assert list(y_loaded) == ["air", "makan", "saya", "tuli"]
    assert g_loaded is not None and list(g_loaded[:2]) == ["old_0", "old_1"]


def test_extract_wl_sequence_from_video_file(tmp_path):
    vid_path = tmp_path / "air_01.mp4"
    blank = np.zeros((64, 64, 3), dtype=np.uint8)
    writer = cv2.VideoWriter(str(vid_path), cv2.VideoWriter_fourcc(*"mp4v"), 10, (64, 64))
    for _ in range(4):
        writer.write(blank)
    writer.release()

    hand_det = MagicMock(spec=["detect"])
    hand_det.detect.return_value = SimpleNamespace(
        hand_landmarks=[
            _make_hand_lms(wrist_x=0.3, wrist_y=0.6, thumb_x=0.38, pinky_x=0.22, finger_y=0.55)
        ]
    )
    pose_det = MagicMock(spec=["detect"])
    pose_det.detect.return_value = SimpleNamespace(pose_landmarks=[_make_pose_lms()])

    seq = extract_wl_sequence_from_video_file(vid_path, hand_det, pose_det)
    assert seq.shape == (WL_SEQUENCE_LEN, WL_TEMPORAL_FEATURE_DIM)
    assert seq.dtype == np.float32
    assert np.all(np.isfinite(seq))


def test_finetune_wl_head_in_place_updates_and_preserves_absent_classes(tmp_path):
    import json

    base_tflite = Path("artifacts/bisindo_wl_model.tflite")
    labels_path = Path("artifacts/bisindo_wl_labels.json")
    if not base_tflite.exists() or not labels_path.exists():
        pytest.skip("bisindo_wl_model.tflite not downloaded")

    payload = json.loads(labels_path.read_text(encoding="utf-8"))
    i2l = payload["index_to_label"]
    classes = [str(i2l[str(i)]) for i in range(len(i2l))]

    rng = np.random.default_rng(19)
    X_seq = rng.normal(0.0, 0.3, size=(6, WL_SEQUENCE_LEN, WL_TEMPORAL_FEATURE_DIM)).astype(np.float32)
    y_labels = np.array(["air", "makan", "air", "makan", "air", "makan"])

    _, w_before, b_before = extract_wl_backbone_embeddings(base_tflite, X_seq[:1])

    out_tflite = tmp_path / "wl_finetuned.tflite"
    acc = finetune_wl_head_in_place(
        base_tflite_path=base_tflite,
        classes=classes,
        X_seq=X_seq,
        y_labels=y_labels,
        output_tflite_path=out_tflite,
        epochs=5,
        learning_rate=1e-3,
        l2_sp_alpha=1e-2,
    )

    assert out_tflite.exists()
    assert 0.0 <= acc <= 1.0

    _, w_after, b_after = extract_wl_backbone_embeddings(out_tflite, X_seq[:1])
    absent_idx = classes.index("tuli")
    assert np.allclose(w_after[absent_idx], w_before[absent_idx], atol=1e-6)
    assert np.isclose(b_after[absent_idx], b_before[absent_idx], atol=1e-6)

    predictor = WordLevelPredictor(out_tflite, labels_path)
    frames = [rng.normal(0.0, 0.2, size=WL_RAW_FEATURE_DIM).astype(np.float32) for _ in range(10)]
    preds = predictor.predict(frames)
    assert len(preds) == len(classes)
    assert np.isclose(sum(p.confidence for p in preds), 1.0, atol=1e-4)
