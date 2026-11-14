import numpy as np

from bisindo.dataset import (
    extract_base_group_id,
    load_landmarks_npz,
    load_landmarks_with_groups,
    merge_datasets,
    merge_datasets_with_groups,
    save_landmarks_npz,
    split_dataset,
)
from bisindo.features import FEATURE_DIM


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
