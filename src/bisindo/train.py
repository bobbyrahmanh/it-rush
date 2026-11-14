"""Training and evaluation pipeline for the BISINDO Alphabet MLP model."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import numpy as np
import tensorflow as tf
from sklearn.metrics import classification_report
from sklearn.utils.class_weight import compute_class_weight

from bisindo.dataset import (
    DatasetSplits,
    merge_datasets_with_groups,
    split_dataset,
)
from bisindo.features import (
    add_landmark_jitter,
    flip_and_swap_features,
    make_single_hand_fallback,
)
from bisindo.model import (
    build_alphabet_mlp,
    export_tfjs_layers,
    export_tflite_f32,
    save_labels_json,
)


@dataclass(frozen=True)
class TrainResult:
    test_loss: float
    test_accuracy: float
    report: str
    tflite_path: Path
    labels_path: Path
    tfjs_model_path: Path | None = None


def augment_training_split(
    X_train: np.ndarray,
    y_train: np.ndarray,
    flip_swap: bool = True,
    single_hand_ratio: float = 0.15,
    jitter_std: float = 0.015,
    jitter_copies: int = 2,
    seed: int = 42,
) -> tuple[np.ndarray, np.ndarray]:
    """Augment training landmark features without touching validation/test splits."""
    rng = np.random.default_rng(seed)
    X_parts = [X_train]
    y_parts = [y_train]

    if flip_swap:
        X_flip = np.stack([flip_and_swap_features(x) for x in X_train], axis=0)
        X_parts.append(X_flip)
        y_parts.append(y_train)

    if single_hand_ratio > 0.0:
        n_single = max(1, int(len(X_train) * single_hand_ratio))
        idx = rng.choice(len(X_train), size=n_single, replace=False)
        X_single = np.stack(
            [
                make_single_hand_fallback(
                    X_train[i], keep="left" if rng.random() < 0.5 else "right"
                )
                for i in idx
            ],
            axis=0,
        )
        X_parts.append(X_single)
        y_parts.append(y_train[idx])

    for _ in range(jitter_copies):
        X_jit = np.stack(
            [add_landmark_jitter(x, std=jitter_std, rng=rng) for x in X_train], axis=0
        )
        X_parts.append(X_jit)
        y_parts.append(y_train)

    X_aug = np.concatenate(X_parts, axis=0)
    y_aug = np.concatenate(y_parts, axis=0)

    perm = rng.permutation(len(X_aug))
    return X_aug[perm], y_aug[perm]


def run_training(
    npz_paths: list[str | Path],
    classes: list[str],
    tflite_out: str | Path,
    labels_out: str | Path,
    tfjs_dir: str | Path | None = None,
    *,
    seed: int = 42,
    val_split: float = 0.15,
    test_split: float = 0.15,
    batch_size: int = 64,
    epochs: int = 120,
    learning_rate: float = 1e-3,
    early_stopping_patience: int = 15,
    reduce_lr_patience: int = 6,
    flip_swap: bool = True,
    single_hand_ratio: float = 0.15,
    jitter_std: float = 0.015,
    jitter_copies: int = 2,
) -> TrainResult:
    """Full training pipeline: merge -> group-isolated split -> augment -> fit -> eval -> export."""
    tf.keras.utils.set_random_seed(seed)

    X, y, groups = merge_datasets_with_groups(npz_paths, classes)
    splits: DatasetSplits = split_dataset(
        X, y, val_split=val_split, test_split=test_split, seed=seed, groups=groups
    )

    X_train_aug, y_train_aug = augment_training_split(
        splits.X_train,
        splits.y_train,
        flip_swap=flip_swap,
        single_hand_ratio=single_hand_ratio,
        jitter_std=jitter_std,
        jitter_copies=jitter_copies,
        seed=seed,
    )

    unique_classes = np.unique(y_train_aug)
    weights = compute_class_weight("balanced", classes=unique_classes, y=y_train_aug)
    class_weight = {int(c): float(w) for c, w in zip(unique_classes, weights)}

    model = build_alphabet_mlp(
        num_classes=len(classes),
        learning_rate=learning_rate,
    )

    callbacks = [
        tf.keras.callbacks.EarlyStopping(
            monitor="val_loss",
            patience=early_stopping_patience,
            restore_best_weights=True,
        ),
        tf.keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss",
            factor=0.5,
            patience=reduce_lr_patience,
            min_lr=1e-5,
        ),
    ]

    model.fit(
        X_train_aug,
        y_train_aug,
        validation_data=(splits.X_val, splits.y_val),
        epochs=epochs,
        batch_size=batch_size,
        class_weight=class_weight,
        callbacks=callbacks,
        verbose=1,
    )

    test_loss, test_acc = model.evaluate(splits.X_test, splits.y_test, verbose=0)
    y_pred = np.argmax(model.predict(splits.X_test, verbose=0), axis=1)

    present_labels = sorted(np.unique(splits.y_test).tolist())
    present_names = [classes[i] for i in present_labels]
    report = classification_report(
        splits.y_test,
        y_pred,
        labels=present_labels,
        target_names=present_names,
        zero_division=0,
    )

    tflite_path = export_tflite_f32(model, tflite_out)
    labels_path = save_labels_json(classes, labels_out)
    tfjs_model_path = export_tfjs_layers(model, classes, tfjs_dir) if tfjs_dir else None

    return TrainResult(
        test_loss=float(test_loss),
        test_accuracy=float(test_acc),
        report=report,
        tflite_path=tflite_path,
        labels_path=labels_path,
        tfjs_model_path=tfjs_model_path,
    )
