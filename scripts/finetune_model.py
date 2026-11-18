"""Fine-tune the pretrained KawanIsyarat BISINDO Alphabet model with new datasets."""

from __future__ import annotations

import argparse
from pathlib import Path

import yaml

from bisindo.dataset import summarize_dataset_npz
from bisindo.train import run_finetuning


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Fine-tune pretrained BISINDO Alphabet model and sync to TFLite + TF.js"
    )
    parser.add_argument("--config", type=Path, default=Path("configs/config.yaml"))
    parser.add_argument(
        "--extra-npz",
        type=Path,
        nargs="*",
        default=[],
        help="Optional extra NPZ landmark files to include in fine-tuning",
    )
    parser.add_argument("--base-tflite", type=Path, default=None, help="Override base TFLite path")
    parser.add_argument("--base-labels", type=Path, default=None, help="Override base labels JSON")
    parser.add_argument("--warmup-epochs", type=int, default=None)
    parser.add_argument("--epochs", type=int, default=None)
    parser.add_argument("--lr", type=float, default=None, help="Override stage-2 learning rate")
    parser.add_argument("--l2-sp-alpha", type=float, default=None)
    parser.add_argument(
        "--no-sync-public",
        action="store_true",
        help="Do not copy exported TF.js + TFLite files into public/models/bisindo/",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    cfg = yaml.safe_load(args.config.read_text(encoding="utf-8"))
    paths = cfg["paths"]
    f_cfg = cfg["finetuning"]
    aug_cfg = cfg["training"]["augment"]

    npz_candidates = [
        Path(paths["public_npz"]),
        Path(paths["webcam_npz"]),
        *args.extra_npz,
    ]
    existing = [p for p in npz_candidates if p.exists()]
    if not existing:
        raise FileNotFoundError(
            "No dataset NPZ files found. Run scripts/prepare_dataset.py or "
            "scripts/collect_webcam.py first."
        )

    counts = summarize_dataset_npz(existing)
    print(f"Fine-tuning datasets : {[str(p) for p in existing]}")
    print(f"Samples per class    : {counts}")

    base_tflite = args.base_tflite or Path(paths["tflite_model"])
    base_labels = args.base_labels or Path(paths["labels_json"])
    public_dir = None if args.no_sync_public else paths.get("public_models_dir")

    result = run_finetuning(
        npz_paths=existing,
        base_tflite_path=base_tflite,
        base_labels_path=base_labels,
        tflite_out=paths["tflite_model"],
        labels_out=paths["labels_json"],
        tfjs_dir=paths.get("tfjs_dir"),
        public_models_dir=public_dir,
        seed=f_cfg["seed"],
        val_split=f_cfg["val_split"],
        test_split=f_cfg["test_split"],
        batch_size=f_cfg["batch_size"],
        warmup_epochs=(
            args.warmup_epochs if args.warmup_epochs is not None else f_cfg["warmup_epochs"]
        ),
        warmup_lr=f_cfg["warmup_lr"],
        epochs=args.epochs if args.epochs is not None else f_cfg["epochs"],
        learning_rate=args.lr if args.lr is not None else f_cfg["learning_rate"],
        l2_sp_alpha=(
            args.l2_sp_alpha if args.l2_sp_alpha is not None else f_cfg["l2_sp_alpha"]
        ),
        early_stopping_patience=f_cfg["early_stopping_patience"],
        reduce_lr_patience=f_cfg["reduce_lr_patience"],
        flip_swap=aug_cfg["flip_swap"],
        single_hand_ratio=aug_cfg["single_hand_ratio"],
        jitter_std=aug_cfg["jitter_std"],
        jitter_copies=aug_cfg["jitter_copies"],
    )

    print(f"\nTest Loss: {result.test_loss:.4f} | Test Accuracy: {result.test_accuracy:.4%}")
    print("\nClassification Report:\n" + result.report)
    print(f"Updated TFLite : {result.tflite_path}")
    print(f"Updated Labels : {result.labels_path}")
    if result.tfjs_model_path:
        print(f"Updated TF.js  : {result.tfjs_model_path}")
    if public_dir:
        print(f"Synced Frontend: {public_dir}")


if __name__ == "__main__":
    main()
