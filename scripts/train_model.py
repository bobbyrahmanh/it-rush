"""Train the BISINDO Alphabet MLP model and export TFLite + TensorFlow.js artifacts."""

from __future__ import annotations

import argparse
from pathlib import Path

import yaml

from bisindo.train import run_training


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train BISINDO Alphabet model -> TFLite + TF.js")
    parser.add_argument("--config", type=Path, default=Path("configs/config.yaml"))
    parser.add_argument(
        "--extra-npz",
        type=Path,
        nargs="*",
        default=[],
        help="Optional additional NPZ landmark files to merge",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    cfg = yaml.safe_load(args.config.read_text(encoding="utf-8"))

    npz_paths = [
        Path(cfg["paths"]["public_npz"]),
        Path(cfg["paths"]["webcam_npz"]),
        *args.extra_npz,
    ]
    existing = [p for p in npz_paths if p.exists()]
    if not existing:
        raise FileNotFoundError(
            "No dataset NPZ files found. Run scripts/prepare_dataset.py or scripts/collect_webcam.py first."
        )

    print(f"Merging datasets from: {[str(p) for p in existing]}")
    t_cfg = cfg["training"]
    aug_cfg = t_cfg["augment"]

    result = run_training(
        npz_paths=existing,
        classes=cfg["classes"],
        tflite_out=cfg["paths"]["tflite_model"],
        labels_out=cfg["paths"]["labels_json"],
        tfjs_dir=cfg["paths"].get("tfjs_dir"),
        seed=t_cfg["seed"],
        val_split=t_cfg["val_split"],
        test_split=t_cfg["test_split"],
        batch_size=t_cfg["batch_size"],
        epochs=t_cfg["epochs"],
        learning_rate=t_cfg["learning_rate"],
        early_stopping_patience=t_cfg["early_stopping_patience"],
        reduce_lr_patience=t_cfg["reduce_lr_patience"],
        flip_swap=aug_cfg["flip_swap"],
        single_hand_ratio=aug_cfg["single_hand_ratio"],
        jitter_std=aug_cfg["jitter_std"],
        jitter_copies=aug_cfg["jitter_copies"],
    )

    print(f"\nTest Loss: {result.test_loss:.4f} | Test Accuracy: {result.test_accuracy:.4%}")
    print("\nClassification Report:\n" + result.report)
    print(f"Exported TFLite model: {result.tflite_path}")
    print(f"Exported Labels JSON : {result.labels_path}")
    if result.tfjs_model_path:
        print(f"Exported TF.js model : {result.tfjs_model_path}")


if __name__ == "__main__":
    main()
