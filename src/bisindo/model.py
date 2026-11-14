"""Keras Dense MLP classifier, F32 TFLite exporter, and TensorFlow.js exporter."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import numpy as np
import tensorflow as tf

from bisindo.features import FEATURE_DIM


def build_alphabet_mlp(
    num_classes: int = 27,
    feature_dim: int = FEATURE_DIM,
    learning_rate: float = 1e-3,
) -> tf.keras.Model:
    """Build a compact, high-accuracy Dense MLP for 86-dim hand landmark features."""
    inputs = tf.keras.Input(shape=(feature_dim,), dtype=tf.float32, name="landmarks")

    x = tf.keras.layers.Dense(256, use_bias=False)(inputs)
    x = tf.keras.layers.BatchNormalization()(x)
    x = tf.keras.layers.Activation("relu")(x)
    x = tf.keras.layers.Dropout(0.30)(x)

    x = tf.keras.layers.Dense(192, use_bias=False)(x)
    x = tf.keras.layers.BatchNormalization()(x)
    x = tf.keras.layers.Activation("relu")(x)
    x = tf.keras.layers.Dropout(0.25)(x)

    x = tf.keras.layers.Dense(128, use_bias=False)(x)
    x = tf.keras.layers.BatchNormalization()(x)
    x = tf.keras.layers.Activation("relu")(x)
    x = tf.keras.layers.Dropout(0.15)(x)

    outputs = tf.keras.layers.Dense(num_classes, activation="softmax", name="probs")(x)

    model = tf.keras.Model(inputs=inputs, outputs=outputs, name="bisindo_alphabet_mlp")
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=learning_rate),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model


def export_tflite_f32(model: tf.keras.Model, output_path: str | Path) -> Path:
    """Export a trained Keras model to Float32 TFLite (KawanIsyarat compatible)."""
    out_path = Path(output_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    converter.optimizations = []
    tflite_bytes = converter.convert()
    out_path.write_bytes(tflite_bytes)
    return out_path


def save_labels_json(classes: list[str], output_path: str | Path) -> Path:
    """Save ordered class list to JSON matching `bisindo_alphabet_labels.json`."""
    out_path = Path(output_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(classes, indent=2) + "\n", encoding="utf-8")
    return out_path


def _activation_name(activation: Any) -> str:
    if activation is None:
        return "linear"
    if isinstance(activation, str):
        return activation
    return getattr(activation, "__name__", "linear")


def _serialize_layer_for_tfjs(
    layer: tf.keras.layers.Layer,
    is_first_trainable: bool,
    feature_dim: int,
) -> tuple[dict[str, Any] | None, list[tuple[str, np.ndarray]]]:
    """Convert a Keras 3 layer into a TF.js-compatible Keras 2 layer config + weights."""
    if isinstance(layer, tf.keras.layers.InputLayer):
        return None, []

    base_cfg: dict[str, Any] = {
        "name": layer.name,
        "trainable": bool(layer.trainable),
        "dtype": "float32",
    }
    if is_first_trainable:
        base_cfg["batch_input_shape"] = [None, feature_dim]

    weights_out: list[tuple[str, np.ndarray]] = []
    for w in layer.weights:
        short_name = w.name.split("/")[-1].split(":")[0]
        arr = np.asarray(w.numpy(), dtype="<f4")
        weights_out.append((f"{layer.name}/{short_name}", arr))

    if isinstance(layer, tf.keras.layers.Dense):
        cfg = {
            **base_cfg,
            "units": int(layer.units),
            "activation": _activation_name(layer.activation),
            "use_bias": bool(layer.use_bias),
        }
        return {"class_name": "Dense", "config": cfg}, weights_out

    if isinstance(layer, tf.keras.layers.BatchNormalization):
        cfg = {
            **base_cfg,
            "axis": [1],
            "momentum": float(layer.momentum),
            "epsilon": float(layer.epsilon),
            "center": bool(layer.center),
            "scale": bool(layer.scale),
        }
        return {"class_name": "BatchNormalization", "config": cfg}, weights_out

    if isinstance(layer, tf.keras.layers.Activation):
        cfg = {**base_cfg, "activation": _activation_name(layer.activation)}
        return {"class_name": "Activation", "config": cfg}, weights_out

    if isinstance(layer, tf.keras.layers.ReLU):
        cfg = {
            **base_cfg,
            "max_value": float(layer.max_value) if layer.max_value is not None else None,
            "negative_slope": float(layer.negative_slope),
            "threshold": float(layer.threshold),
        }
        return {"class_name": "ReLU", "config": cfg}, weights_out

    if isinstance(layer, tf.keras.layers.Dropout):
        cfg = {**base_cfg, "rate": float(layer.rate)}
        return {"class_name": "Dropout", "config": cfg}, weights_out

    raise TypeError(f"Unsupported layer type for TF.js export: {type(layer).__name__}")


def export_tfjs_layers(
    model: tf.keras.Model,
    classes: list[str],
    output_dir: str | Path,
) -> Path:
    """Export a sequential/linear Keras MLP to TensorFlow.js `layers-model` artifacts.

    Creates `model.json`, `group1-shard1of1.bin`, and `labels.json` inside `output_dir`.
    """
    out_dir = Path(output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    feature_dim = int(model.input_shape[-1])
    tfjs_layers: list[dict[str, Any]] = [
        {
            "class_name": "InputLayer",
            "config": {
                "batch_input_shape": [None, feature_dim],
                "dtype": "float32",
                "sparse": False,
                "ragged": False,
                "name": "landmarks",
            },
        }
    ]

    weight_specs: list[dict[str, Any]] = []
    weight_buffers: list[bytes] = []
    is_first = True

    for layer in model.layers:
        layer_cfg, layer_weights = _serialize_layer_for_tfjs(
            layer, is_first_trainable=is_first, feature_dim=feature_dim
        )
        if layer_cfg is None:
            continue
        is_first = False
        tfjs_layers.append(layer_cfg)
        for w_name, arr in layer_weights:
            weight_specs.append(
                {
                    "name": w_name,
                    "shape": list(arr.shape),
                    "dtype": "float32",
                }
            )
            weight_buffers.append(arr.tobytes(order="C"))

    shard_name = "group1-shard1of1.bin"
    (out_dir / shard_name).write_bytes(b"".join(weight_buffers))

    model_json = {
        "format": "layers-model",
        "generatedBy": "bisindo-tfjs-exporter",
        "convertedBy": "TensorFlow.js Converter",
        "modelTopology": {
            "keras_version": "2.15.0",
            "backend": "tensorflow",
            "model_config": {
                "class_name": "Sequential",
                "config": {
                    "name": model.name,
                    "layers": tfjs_layers,
                },
            },
        },
        "weightsManifest": [
            {
                "paths": [shard_name],
                "weights": weight_specs,
            }
        ],
    }

    (out_dir / "model.json").write_text(
        json.dumps(model_json, indent=2) + "\n", encoding="utf-8"
    )
    save_labels_json(classes, out_dir / "labels.json")
    return out_dir / "model.json"


def convert_tflite_mlp_to_keras(tflite_path: str | Path) -> tf.keras.Model:
    """Reconstruct a Keras MLP model from a pure-Dense Float32 `.tflite` model."""
    interpreter = tf.lite.Interpreter(
        model_path=str(tflite_path),
        experimental_op_resolver_type=tf.lite.experimental.OpResolverType.BUILTIN_WITHOUT_DEFAULT_DELEGATES,
    )
    interpreter.allocate_tensors()

    tensor_details = {t["index"]: t for t in interpreter.get_tensor_details()}
    ops = interpreter._get_ops_details()

    fc_ops = [op for op in ops if op["op_name"] == "FULLY_CONNECTED"]
    if not fc_ops:
        raise ValueError(f"No FULLY_CONNECTED ops found in {tflite_path}")

    softmax_inputs = {
        int(op["inputs"][0]) for op in ops if op["op_name"] == "SOFTMAX"
    }

    input_details = interpreter.get_input_details()
    feature_dim = int(input_details[0]["shape"][-1])

    inputs = tf.keras.Input(shape=(feature_dim,), dtype=tf.float32, name="landmarks")
    x = inputs

    layers_and_weights: list[tuple[tf.keras.layers.Dense, list[np.ndarray]]] = []
    for idx, op in enumerate(fc_ops):
        weight_idx = int(op["inputs"][1])
        bias_idx = int(op["inputs"][2]) if len(op["inputs"]) > 2 else -1
        out_idx = int(op["outputs"][0])

        w = interpreter.get_tensor(weight_idx).astype(np.float32)
        use_bias = bias_idx >= 0
        weights = [w.T.copy()]
        if use_bias:
            b = interpreter.get_tensor(bias_idx).astype(np.float32)
            weights.append(b.copy())

        out_name = tensor_details[out_idx]["name"]
        if idx == len(fc_ops) - 1 and out_idx in softmax_inputs:
            activation = "softmax"
        elif "Relu" in out_name or "relu" in out_name:
            activation = "relu"
        else:
            activation = "linear"

        layer = tf.keras.layers.Dense(
            units=int(w.shape[0]),
            activation=activation,
            use_bias=use_bias,
            name=f"dense_{idx + 1}",
        )
        x = layer(x)
        layers_and_weights.append((layer, weights))

    model = tf.keras.Model(
        inputs=inputs, outputs=x, name="kawanisyarat_bisindo_alphabet_mlp"
    )
    for layer, weights in layers_and_weights:
        layer.set_weights(weights)

    return model
