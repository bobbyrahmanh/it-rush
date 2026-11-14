"""Convert KawanIsyarat's Float32 TFLite BISINDO Alphabet model to TensorFlow.js."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import tensorflow as tf
import yaml

from bisindo.model import convert_tflite_mlp_to_keras, export_tfjs_layers


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Convert Float32 TFLite MLP to TensorFlow.js layers-model"
    )
    parser.add_argument("--config", type=Path, default=Path("configs/config.yaml"))
    parser.add_argument("--tflite", type=Path, default=None, help="Override .tflite path")
    parser.add_argument("--labels", type=Path, default=None, help="Override labels.json path")
    parser.add_argument("--output-dir", type=Path, default=None, help="Override tfjs_dir")
    return parser.parse_args()


def verify_parity(
    tflite_path: Path,
    keras_model: tf.keras.Model,
    num_samples: int = 10,
    seed: int = 42,
) -> float:
    """Compare TFLite and reconstructed Keras outputs across random `[1, 86]` inputs."""
    interp = tf.lite.Interpreter(model_path=str(tflite_path))
    interp.allocate_tensors()
    in_idx = interp.get_input_details()[0]["index"]
    out_idx = interp.get_output_details()[0]["index"]
    feature_dim = int(interp.get_input_details()[0]["shape"][-1])

    rng = np.random.default_rng(seed)
    max_diff = 0.0
    for _ in range(num_samples):
        x = rng.uniform(0.0, 1.0, size=(1, feature_dim)).astype(np.float32)
        interp.set_tensor(in_idx, x)
        interp.invoke()
        tflite_out = interp.get_tensor(out_idx)
        keras_out = keras_model(x, training=False).numpy()
        diff = float(np.max(np.abs(tflite_out - keras_out)))
        max_diff = max(max_diff, diff)

    return max_diff


def main() -> None:
    args = parse_args()
    cfg = yaml.safe_load(args.config.read_text(encoding="utf-8"))

    tflite_path = args.tflite or Path(cfg["paths"]["tflite_model"])
    labels_path = args.labels or Path(cfg["paths"]["labels_json"])
    output_dir = args.output_dir or Path(cfg["paths"]["tfjs_dir"])

    if not tflite_path.exists():
        raise FileNotFoundError(f"TFLite model not found: {tflite_path}")
    if not labels_path.exists():
        raise FileNotFoundError(f"Labels JSON not found: {labels_path}")

    labels: list[str] = json.loads(labels_path.read_text(encoding="utf-8"))
    model = convert_tflite_mlp_to_keras(tflite_path)

    max_diff = verify_parity(tflite_path, model)
    print(f"Parity check max abs diff (TFLite vs Keras): {max_diff:.2e}")
    if max_diff >= 1e-5:
        raise RuntimeError(f"Parity check failed: max_diff={max_diff} >= 1e-5")

    model_json_path = export_tfjs_layers(model, labels, output_dir)
    print(f"Exported TF.js model : {model_json_path}")
    print(f"Exported TF.js shard : {output_dir / 'group1-shard1of1.bin'}")
    print(f"Exported TF.js labels: {output_dir / 'labels.json'}")


if __name__ == "__main__":
    main()
