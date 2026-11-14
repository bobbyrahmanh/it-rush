import json

import numpy as np

from bisindo.dataset import save_landmarks_npz
from bisindo.features import FEATURE_DIM
from bisindo.train import augment_training_split, run_training


def test_augment_training_split_increases_dataset_size():
    rng = np.random.default_rng(0)
    X = rng.random((20, FEATURE_DIM), dtype=np.float32)
    y = np.repeat([0, 1], 10)

    X_aug, y_aug = augment_training_split(
        X,
        y,
        flip_swap=True,
        single_hand_ratio=0.2,
        jitter_std=0.01,
        jitter_copies=1,
        seed=42,
    )

    # 20 original + 20 flip_swap + 4 single_hand + 20 jitter = 64
    assert len(X_aug) == 64
    assert len(y_aug) == 64


def test_run_training_end_to_end_synthetic(tmp_path):
    classes = ["A", "B", "NOTHING"]
    rng = np.random.default_rng(1)

    X_parts = []
    y_parts = []
    for idx, cls in enumerate(classes):
        cluster = rng.normal(loc=0.2 + idx * 0.3, scale=0.03, size=(15, FEATURE_DIM))
        X_parts.append(np.clip(cluster, 0.0, 1.0).astype(np.float32))
        y_parts.append(np.full(15, cls))

    npz_path = tmp_path / "synth.npz"
    save_landmarks_npz(npz_path, np.concatenate(X_parts), np.concatenate(y_parts))

    tflite_out = tmp_path / "artifacts" / "model.tflite"
    labels_out = tmp_path / "artifacts" / "labels.json"
    tfjs_dir = tmp_path / "artifacts" / "tfjs"

    res = run_training(
        npz_paths=[npz_path],
        classes=classes,
        tflite_out=tflite_out,
        labels_out=labels_out,
        tfjs_dir=tfjs_dir,
        epochs=5,
        batch_size=8,
        val_split=0.2,
        test_split=0.2,
        jitter_copies=1,
    )

    assert res.tflite_path.exists()
    assert res.labels_path.exists()
    assert res.tfjs_model_path is not None and res.tfjs_model_path.exists()
    assert (tfjs_dir / "group1-shard1of1.bin").exists()
    assert json.loads((tfjs_dir / "labels.json").read_text(encoding="utf-8")) == classes
    assert json.loads(res.labels_path.read_text(encoding="utf-8")) == classes
    assert 0.0 <= res.test_accuracy <= 1.0
