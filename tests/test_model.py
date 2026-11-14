import json
from pathlib import Path

import numpy as np
import pytest
import tensorflow as tf

from bisindo.features import FEATURE_DIM
from bisindo.model import (
    build_alphabet_mlp,
    build_finetune_alphabet_model,
    convert_tflite_mlp_to_keras,
    export_tfjs_layers,
    export_tflite_f32,
    save_labels_json,
)


def test_build_alphabet_mlp_shapes_and_probabilities():
    model = build_alphabet_mlp(num_classes=27, feature_dim=FEATURE_DIM)
    x = np.random.default_rng(0).random((4, FEATURE_DIM), dtype=np.float32)
    preds = model(x, training=False).numpy()

    assert preds.shape == (4, 27)
    assert np.allclose(preds.sum(axis=-1), 1.0, atol=1e-5)
    assert np.all(preds >= 0.0)


def test_export_tflite_f32_matches_keras_output(tmp_path):
    model = build_alphabet_mlp(num_classes=5, feature_dim=FEATURE_DIM)
    tflite_path = tmp_path / "test_model_f32.tflite"
    export_tflite_f32(model, tflite_path)

    assert tflite_path.exists()
    assert tflite_path.stat().st_size > 0

    interpreter = tf.lite.Interpreter(model_path=str(tflite_path))
    interpreter.allocate_tensors()
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()

    assert list(input_details[0]["shape"]) == [1, FEATURE_DIM]
    assert input_details[0]["dtype"] == np.float32
    assert list(output_details[0]["shape"]) == [1, 5]

    x = np.random.default_rng(7).random((1, FEATURE_DIM), dtype=np.float32)
    keras_out = model(x, training=False).numpy()

    interpreter.set_tensor(input_details[0]["index"], x)
    interpreter.invoke()
    tflite_out = interpreter.get_tensor(output_details[0]["index"])

    assert np.allclose(keras_out, tflite_out, atol=1e-5)


def test_export_tfjs_layers_creates_valid_manifest_and_shard(tmp_path):
    classes = ["A", "B", "C", "NOTHING", "Z"]
    model = build_alphabet_mlp(num_classes=len(classes), feature_dim=FEATURE_DIM)
    out_dir = tmp_path / "tfjs"

    model_json_path = export_tfjs_layers(model, classes, out_dir)
    assert model_json_path.exists()
    shard_path = out_dir / "group1-shard1of1.bin"
    assert shard_path.exists()
    assert json.loads((out_dir / "labels.json").read_text(encoding="utf-8")) == classes

    payload = json.loads(model_json_path.read_text(encoding="utf-8"))
    assert payload["format"] == "layers-model"
    assert payload["modelTopology"]["model_config"]["class_name"] == "Sequential"

    weights_spec = payload["weightsManifest"][0]["weights"]
    total_floats = sum(int(np.prod(w["shape"])) for w in weights_spec)
    assert shard_path.stat().st_size == total_floats * 4


def test_convert_tflite_mlp_to_keras_synthetic_parity(tmp_path):
    model = build_alphabet_mlp(num_classes=4, feature_dim=FEATURE_DIM)
    tflite_path = tmp_path / "synth.tflite"
    export_tflite_f32(model, tflite_path)

    reconstructed = convert_tflite_mlp_to_keras(tflite_path)
    x = np.random.default_rng(11).random((3, FEATURE_DIM), dtype=np.float32)
    orig_out = model(x, training=False).numpy()
    rec_out = reconstructed(x, training=False).numpy()

    assert np.allclose(orig_out, rec_out, atol=1e-5)


def test_convert_kawanisyarat_tflite_parity_and_tfjs(tmp_path):
    tflite_path = Path("artifacts/bisindo_alphabet_model_f32.tflite")
    labels_path = Path("artifacts/bisindo_alphabet_labels.json")
    if not tflite_path.exists():
        pytest.skip("KawanIsyarat TFLite artifact not present")

    reconstructed = convert_tflite_mlp_to_keras(tflite_path)
    interp = tf.lite.Interpreter(model_path=str(tflite_path))
    interp.allocate_tensors()
    in_idx = interp.get_input_details()[0]["index"]
    out_idx = interp.get_output_details()[0]["index"]

    x = np.random.default_rng(99).uniform(0.0, 1.0, size=(1, FEATURE_DIM)).astype(np.float32)
    interp.set_tensor(in_idx, x)
    interp.invoke()
    tflite_out = interp.get_tensor(out_idx)
    keras_out = reconstructed(x, training=False).numpy()

    assert np.allclose(tflite_out, keras_out, atol=1e-5)

    labels = json.loads(labels_path.read_text(encoding="utf-8"))
    tfjs_json = export_tfjs_layers(reconstructed, labels, tmp_path / "tfjs")
    assert tfjs_json.exists()
    assert (tmp_path / "tfjs" / "group1-shard1of1.bin").exists()


def test_save_labels_json_format(tmp_path):
    classes = ["A", "B", "NOTHING", "Z"]
    out = tmp_path / "labels.json"
    save_labels_json(classes, out)

    loaded = json.loads(out.read_text(encoding="utf-8"))
    assert loaded == classes


def test_build_finetune_alphabet_model_preserves_and_expands_classes(tmp_path):
    base_classes = ["A", "B", "NOTHING", "Z"]
    base_keras = build_alphabet_mlp(num_classes=len(base_classes), feature_dim=FEATURE_DIM)
    base_tflite = tmp_path / "base.tflite"
    export_tflite_f32(base_keras, base_tflite)

    # Same classes -> exact prediction parity with reconstructed base model
    model_same, shared_same, _ = build_finetune_alphabet_model(
        base_tflite, base_classes, base_classes, l2_sp_alpha=1e-2
    )
    ref_keras = convert_tflite_mlp_to_keras(base_tflite)
    x = np.random.default_rng(3).uniform(0.0, 1.0, size=(2, FEATURE_DIM)).astype(np.float32)
    assert shared_same == {0: 0, 1: 1, 2: 2, 3: 3}
    assert np.allclose(model_same(x, training=False).numpy(), ref_keras(x, training=False).numpy(), atol=1e-5)

    # Expanded classes -> adds "HALO" while copying original weights
    target_classes = [*base_classes, "HALO"]
    model_exp, shared_exp, (w_init, b_init) = build_finetune_alphabet_model(
        base_tflite, base_classes, target_classes, l2_sp_alpha=1e-2
    )
    assert model_exp.output_shape == (None, 5)
    assert len(shared_exp) == 4
    ref_weights = ref_keras.layers[-1].get_weights()
    w_ref = ref_weights[0]
    b_ref = ref_weights[1] if len(ref_weights) > 1 else np.zeros((4,), dtype=np.float32)
    assert np.allclose(w_init[:, :4], w_ref)
    assert np.allclose(b_init[:4], b_ref)
    assert any(layer.kernel_regularizer is not None for layer in model_exp.layers[1:])
