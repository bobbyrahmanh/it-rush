from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock

import numpy as np
import pytest

from bisindo.features import FEATURE_DIM, NUM_LANDMARKS
from bisindo.landmarks import (
    create_hands_detector,
    crop_with_yolo_boxes,
    extract_features_from_bgr,
    extract_features_with_yolo_fallback,
    parse_yolo_boxes,
)


def _fake_hand_landmarks(x_offset: float, y_offset: float = 0.3) -> SimpleNamespace:
    lms = [
        SimpleNamespace(x=x_offset + (i % 5) * 0.02, y=y_offset + (i // 5) * 0.03)
        for i in range(NUM_LANDMARKS)
    ]
    return SimpleNamespace(landmark=lms)


def _fake_tasks_landmarks(x_offset: float, y_offset: float = 0.3) -> list[SimpleNamespace]:
    return [
        SimpleNamespace(x=x_offset + (i % 5) * 0.02, y=y_offset + (i // 5) * 0.03)
        for i in range(NUM_LANDMARKS)
    ]


def test_extract_features_from_bgr_no_hands():
    detector = MagicMock(spec=["process"])
    detector.process.return_value = SimpleNamespace(multi_hand_landmarks=None)

    img = np.zeros((100, 100, 3), dtype=np.uint8)
    res = extract_features_from_bgr(img, detector)

    assert res.num_hands == 0
    assert res.features is None
    assert res.hands_xy == []


def test_extract_features_from_bgr_tasks_api_two_hands():
    detector = MagicMock(spec=["detect"])
    detector.detect.return_value = SimpleNamespace(
        hand_landmarks=[_fake_tasks_landmarks(0.1), _fake_tasks_landmarks(0.6)]
    )

    img = np.zeros((100, 100, 3), dtype=np.uint8)
    res = extract_features_from_bgr(img, detector)

    assert res.num_hands == 2
    assert res.features is not None
    assert res.features.shape == (FEATURE_DIM,)
    assert res.features[84] >= 0.0


def test_create_hands_detector_tasks_api_runs_on_blank_image():
    task_file = Path("artifacts/mediapipe/hand_landmarker.task")
    if not task_file.exists():
        pytest.skip("hand_landmarker.task not downloaded")

    detector = create_hands_detector(model_asset_path=task_file)
    try:
        img = np.zeros((128, 128, 3), dtype=np.uint8)
        res = extract_features_from_bgr(img, detector)
        assert res.num_hands == 0
        assert res.features is None
    finally:
        detector.close()


def test_parse_and_crop_yolo_boxes(tmp_path):
    lbl_file = tmp_path / "sample.txt"
    lbl_file.write_text("0 0.5 0.5 0.4 0.4\n1 0.7 0.5 0.2 0.2\n", encoding="utf-8")

    boxes = parse_yolo_boxes(lbl_file)
    assert len(boxes) == 2

    img = np.zeros((200, 200, 3), dtype=np.uint8)
    cropped, roi = crop_with_yolo_boxes(img, boxes, pad_ratio=0.2)

    assert cropped.shape[0] > 0 and cropped.shape[1] > 0
    x0, y0, w_norm, h_norm = roi
    assert 0.0 <= x0 < 1.0
    assert 0.0 <= y0 < 1.0
    assert 0.0 < w_norm <= 1.0
    assert 0.0 < h_norm <= 1.0


def test_extract_features_with_yolo_fallback_recovers_missed_hands():
    detector = MagicMock(spec=["process"])
    detector.process.side_effect = [
        SimpleNamespace(multi_hand_landmarks=None),
        SimpleNamespace(
            multi_hand_landmarks=[_fake_hand_landmarks(0.2), _fake_hand_landmarks(0.7)]
        ),
    ]

    img = np.zeros((200, 200, 3), dtype=np.uint8)
    res = extract_features_with_yolo_fallback(
        img,
        detector,
        yolo_boxes=[(0.3, 0.5, 0.2, 0.3), (0.7, 0.5, 0.2, 0.3)],
    )

    assert detector.process.call_count == 2
    assert res.num_hands == 2
    assert res.features is not None
    assert res.features.shape == (FEATURE_DIM,)
    assert res.features[84] >= 0.0
