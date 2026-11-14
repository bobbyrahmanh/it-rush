from types import SimpleNamespace
from unittest.mock import MagicMock

import cv2
import numpy as np

from bisindo.dataset import (
    append_landmarks_npz,
    extract_base_group_id,
    extract_dataset_from_directory,
    load_landmarks_npz,
    load_landmarks_with_groups,
    merge_datasets,
    merge_datasets_with_groups,
    save_landmarks_npz,
    split_dataset,
    summarize_dataset_npz,
)
from bisindo.features import FEATURE_DIM, NUM_LANDMARKS


def test_extract_base_group_id_strips_augmentation_tokens():
    assert extract_base_group_id("A_001.jpg") == "A_001"
    assert extract_base_group_id("A_001_flip.jpg") == "A_001"
    assert extract_base_group_id("A_001_rot15.png") == "A_001"
    assert extract_base_group_id("augmented_image_A_001_rotate.jpg") == "A_001"
    assert extract_base_group_id("A_001.rf.a1b2c3d4.jpg") == "A_001"


def test_save_and_load_landmarks_npz(tmp_path):
    X = np.random.default_rng(0).random((10, FEATURE_DIM), dtype=np.float32)
    y = np.array(["A", "B", "C", "A", "B", "C", "NOTHING", "A", "B", "C"])
    groups = np.array([f"g{i // 2}" for i in range(10)])
    out_file = tmp_path / "sample.npz"

    save_landmarks_npz(out_file, X, y, groups=groups)
    X_loaded, y_loaded = load_landmarks_npz(out_file)
    _, _, g_loaded = load_landmarks_with_groups(out_file)

    assert X_loaded.shape == (10, FEATURE_DIM)
    assert X_loaded.dtype == np.float32
    assert np.allclose(X_loaded, X)
    assert list(y_loaded) == list(y)
    assert g_loaded is not None
    assert list(g_loaded) == list(groups)


def test_merge_datasets_combines_sources_and_filters_unknown_labels(tmp_path):
    classes = ["A", "B", "NOTHING"]

    p1 = tmp_path / "public.npz"
    X1 = np.ones((4, FEATURE_DIM), dtype=np.float32)
    y1 = np.array(["A", "B", "UNKNOWN", "NOTHING"])
    save_landmarks_npz(p1, X1, y1, groups=np.array(["g0", "g1", "g2", "g3"]))

    p2 = tmp_path / "webcam.npz"
    X2 = np.zeros((2, FEATURE_DIM), dtype=np.float32)
    y2 = np.array(["A", "B"])
    save_landmarks_npz(p2, X2, y2)

    X_merged, y_idx = merge_datasets([p1, p2], classes)
    X_mg, y_mg, g_mg = merge_datasets_with_groups([p1, p2], classes)

    assert X_merged.shape == (5, FEATURE_DIM)
    assert y_idx.shape == (5,)
    assert list(y_idx) == [0, 1, 2, 0, 1]
    assert np.array_equal(X_mg, X_merged)
    assert np.array_equal(y_mg, y_idx)
    assert len(g_mg) == 5


def test_split_dataset_stratified_proportions():
    rng = np.random.default_rng(42)
    X = rng.random((90, FEATURE_DIM), dtype=np.float32)
    y = np.repeat([0, 1, 2], 30)

    splits = split_dataset(X, y, val_split=0.2, test_split=0.2, seed=42)

    assert len(splits.X_train) + len(splits.X_val) + len(splits.X_test) == 90
    assert len(splits.X_test) == 18
    assert len(splits.X_val) == 18
    assert len(splits.X_train) == 54
    assert set(splits.y_train) == {0, 1, 2}
    assert set(splits.y_val) == {0, 1, 2}
    assert set(splits.y_test) == {0, 1, 2}


def test_split_dataset_prevents_group_leakage():
    rng = np.random.default_rng(7)
    # 30 groups across 3 classes (10 groups per class), 3 augmented variants per group = 90 rows
    X = np.arange(90 * FEATURE_DIM, dtype=np.float32).reshape(90, FEATURE_DIM)
    # Identify each group cleanly by row 0 value
    groups = np.repeat([f"grp_{i}" for i in range(30)], 3)
    y = np.repeat(np.tile([0, 1, 2], 10), 3)
    # Make X rows encode their group id directly in col 0
    for i in range(30):
        X[i * 3 : (i + 1) * 3, 0] = float(i)

    splits = split_dataset(X, y, val_split=0.2, test_split=0.2, seed=42, groups=groups)

    train_groups = set(splits.X_train[:, 0].tolist())
    val_groups = set(splits.X_val[:, 0].tolist())
    test_groups = set(splits.X_test[:, 0].tolist())

    assert train_groups.isdisjoint(val_groups)
    assert train_groups.isdisjoint(test_groups)
    assert val_groups.isdisjoint(test_groups)
    assert len(splits.X_train) + len(splits.X_val) + len(splits.X_test) == 90


def test_append_landmarks_npz_and_summarize(tmp_path):
    npz_path = tmp_path / "webcam.npz"
    X1 = np.ones((3, FEATURE_DIM), dtype=np.float32)
    y1 = np.array(["A", "A", "B"])
    save_landmarks_npz(npz_path, X1, y1)  # intentionally without groups

    X2 = np.zeros((2, FEATURE_DIM), dtype=np.float32)
    y2 = np.array(["B", "HALO"])
    total = append_landmarks_npz(npz_path, X2, y2)
    assert total == 5

    X_all, y_all, g_all = load_landmarks_with_groups(npz_path)
    assert X_all.shape == (5, FEATURE_DIM)
    assert list(y_all) == ["A", "A", "B", "B", "HALO"]
    assert g_all is not None and list(g_all[:3]) == ["old_0", "old_1", "old_2"]

    counts = summarize_dataset_npz([npz_path, tmp_path / "missing.npz"])
    assert counts == {"A": 2, "B": 2, "HALO": 1}


def test_extract_dataset_from_directory_images_videos_and_new_classes(tmp_path):
    raw_dir = tmp_path / "raw"
    (raw_dir / "A").mkdir(parents=True)
    (raw_dir / "CUSTOM").mkdir(parents=True)

    blank = np.zeros((64, 64, 3), dtype=np.uint8)
    cv2.imwrite(str(raw_dir / "A" / "a_001.jpg"), blank)

    vid_path = raw_dir / "CUSTOM" / "clip1.mp4"
    writer = cv2.VideoWriter(str(vid_path), cv2.VideoWriter_fourcc(*"mp4v"), 10, (64, 64))
    for _ in range(4):
        writer.write(blank)
    writer.release()

    fake_hand = [
        SimpleNamespace(x=0.1 + 0.02 * i, y=0.2 + 0.01 * i, z=0.0)
        for i in range(NUM_LANDMARKS)
    ]
    detector = MagicMock(spec=["detect"])
    detector.detect.return_value = SimpleNamespace(hand_landmarks=[fake_hand])

    # Disallow new classes -> only A extracted
    X1, y1, g1, disc1 = extract_dataset_from_directory(
        raw_dir, {"A", "B"}, detector, allow_new_classes=False, frame_stride=2
    )
    assert X1.shape == (1, FEATURE_DIM)
    assert list(y1) == ["A"]
    assert list(g1) == ["A_a_001"]
    assert disc1 == ["A"]

    # Allow new classes -> A image + 2 strided frames from CUSTOM video
    X2, y2, g2, disc2 = extract_dataset_from_directory(
        raw_dir, {"A", "B"}, detector, allow_new_classes=True, frame_stride=2
    )
    assert X2.shape == (3, FEATURE_DIM)
    assert list(y2) == ["A", "CUSTOM", "CUSTOM"]
    assert list(g2) == ["A_a_001", "CUSTOM_vid_clip1", "CUSTOM_vid_clip1"]
    assert disc2 == ["A", "CUSTOM"]
