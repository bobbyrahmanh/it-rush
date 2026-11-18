import json
from pathlib import Path

import numpy as np
import pytest

from bisindo.dataset import save_landmarks_npz
from bisindo.features import FEATURE_DIM
from bisindo.model import convert_tflite_mlp_to_keras
from bisindo.train import augment_training_split, run_finetuning, run_training


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


def test_run_finetuning_small_subset_preserves_absent_classes_and_exports(tmp_path):
    base_tflite = Path("artifacts/bisindo_alphabet_model_f32.tflite")
    base_labels = Path("artifacts/bisindo_alphabet_labels.json")
    if not base_tflite.exists() or not base_labels.exists():
        pytest.skip("Pretrained KawanIsyarat TFLite artifacts not present")

    labels_list = json.loads(base_labels.read_text(encoding="utf-8"))
    z_idx = labels_list.index("Z")
    base_keras = convert_tflite_mlp_to_keras(base_tflite)
    w_base, b_base = base_keras.layers[-1].get_weights()

    # Tiny subset containing only A, B, and a brand-new class HALO
    rng = np.random.default_rng(12)
    X_sub = np.concatenate(
        [
            np.clip(rng.normal(0.25, 0.04, size=(5, FEATURE_DIM)), 0.0, 1.0),
            np.clip(rng.normal(0.55, 0.04, size=(5, FEATURE_DIM)), 0.0, 1.0),
            np.clip(rng.normal(0.85, 0.04, size=(4, FEATURE_DIM)), 0.0, 1.0),
        ],
        axis=0,
    ).astype(np.float32)
    y_sub = np.array(["A"] * 5 + ["B"] * 5 + ["HALO"] * 4)

    sub_npz = tmp_path / "custom_small.npz"
    save_landmarks_npz(sub_npz, X_sub, y_sub)

    tflite_out = tmp_path / "artifacts" / "bisindo_alphabet_model_f32.tflite"
    labels_out = tmp_path / "artifacts" / "bisindo_alphabet_labels.json"
    tfjs_dir = tmp_path / "artifacts" / "tfjs"
    pub_dir = tmp_path / "public" / "models" / "bisindo"

    res = run_finetuning(
        npz_paths=[sub_npz],
        base_tflite_path=base_tflite,
        base_labels_path=base_labels,
        tflite_out=tflite_out,
        labels_out=labels_out,
        tfjs_dir=tfjs_dir,
        public_models_dir=pub_dir,
        target_classes=None,
        warmup_epochs=2,
        epochs=2,
        batch_size=4,
        jitter_copies=0,
        flip_swap=False,
        single_hand_ratio=0.0,
    )

    assert res.tflite_path.exists()
    assert (tfjs_dir / "model.json").exists()
    assert (tfjs_dir / "group1-shard1of1.bin").exists()
    assert (pub_dir / "model.json").exists()
    assert (pub_dir / "group1-shard1of1.bin").exists()
    assert (pub_dir / "labels.json").exists()
    assert (pub_dir / tflite_out.name).exists()

    new_labels = json.loads(res.labels_path.read_text(encoding="utf-8"))
    assert new_labels == [*labels_list, "HALO"]

    ft_keras = convert_tflite_mlp_to_keras(res.tflite_path)
    w_ft, b_ft = ft_keras.layers[-1].get_weights()
    assert np.allclose(w_ft[:, z_idx], w_base[:, z_idx], atol=1e-6)
    assert np.isclose(b_ft[z_idx], b_base[z_idx], atol=1e-6)
