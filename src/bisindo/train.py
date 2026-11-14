"""Training and evaluation pipeline for the BISINDO Alphabet MLP model."""

from __future__ import annotations

from dataclasses import dataclass
import json
from pathlib import Path
import shutil

import numpy as np
import tensorflow as tf
from sklearn.metrics import classification_report
from sklearn.utils.class_weight import compute_class_weight

from bisindo.dataset import (
    DatasetSplits,
    merge_datasets_with_groups,
    split_dataset,
    summarize_dataset_npz,
)
from bisindo.features import (
    add_landmark_jitter,
    flip_and_swap_features,
    make_single_hand_fallback,
)
from bisindo.model import (
    build_alphabet_mlp,
    build_finetune_alphabet_model,
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


def _safe_split_dataset(
    X: np.ndarray,
    y: np.ndarray,
    groups: np.ndarray,
    val_split: float,
    test_split: float,
    seed: int,
) -> DatasetSplits:
    """Split dataset with group-isolation, falling back cleanly for very small sets."""
    try:
        return split_dataset(
            X, y, val_split=val_split, test_split=test_split, seed=seed, groups=groups
        )
    except ValueError:
        n = len(X)
        if n < 3:
            return DatasetSplits(
                X_train=X, y_train=y, X_val=X, y_val=y, X_test=X, y_test=y
            )
        rng = np.random.default_rng(seed)
        perm = rng.permutation(n)
        n_test = max(1, min(n - 2, int(round(n * test_split))))
        n_val = max(1, min(n - n_test - 1, int(round(n * val_split))))
        n_train = n - n_test - n_val
        return DatasetSplits(
            X_train=X[perm[:n_train]],
            y_train=y[perm[:n_train]],
            X_val=X[perm[n_train : n_train + n_val]],
            y_val=y[perm[n_train : n_train + n_val]],
            X_test=X[perm[n_train + n_val :]],
            y_test=y[perm[n_train + n_val :]],
        )


def _compile_classifier(model: tf.keras.Model, learning_rate: float) -> None:
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=learning_rate),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )


def run_finetuning(
    npz_paths: list[str | Path],
    base_tflite_path: str | Path,
    base_labels_path: str | Path,
    tflite_out: str | Path,
    labels_out: str | Path,
    tfjs_dir: str | Path | None = None,
    public_models_dir: str | Path | None = None,
    target_classes: list[str] | None = None,
    *,
    seed: int = 42,
    val_split: float = 0.15,
    test_split: float = 0.15,
    batch_size: int = 32,
    warmup_epochs: int = 5,
    warmup_lr: float = 5e-4,
    epochs: int = 40,
    learning_rate: float = 1e-4,
    l2_sp_alpha: float = 1e-2,
    early_stopping_patience: int = 10,
    reduce_lr_patience: int = 4,
    flip_swap: bool = True,
    single_hand_ratio: float = 0.15,
    jitter_std: float = 0.015,
    jitter_copies: int = 2,
) -> TrainResult:
    """Two-stage anti-forgetting fine-tuning on top of pretrained KawanIsyarat TFLite."""
    tf.keras.utils.set_random_seed(seed)

    base_classes: list[str] = json.loads(
        Path(base_labels_path).read_text(encoding="utf-8")
    )
    if target_classes is None:
        discovered = summarize_dataset_npz(npz_paths)
        resolved_classes = list(base_classes) + [
            lbl for lbl in sorted(discovered) if lbl not in base_classes
        ]
    else:
        resolved_classes = list(target_classes)

    X, y, groups = merge_datasets_with_groups(npz_paths, resolved_classes)
    splits = _safe_split_dataset(X, y, groups, val_split, test_split, seed)

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

    model, shared_map, (w_init, b_init) = build_finetune_alphabet_model(
        base_tflite_path=base_tflite_path,
        base_classes=base_classes,
        target_classes=resolved_classes,
        learning_rate=learning_rate,
        l2_sp_alpha=l2_sp_alpha,
        seed=seed,
    )

    if warmup_epochs > 0:
        for layer in model.layers[:-1]:
            layer.trainable = False
        model.layers[-1].trainable = True
        _compile_classifier(model, warmup_lr)
        model.fit(
            X_train_aug,
            y_train_aug,
            validation_data=(splits.X_val, splits.y_val),
            epochs=warmup_epochs,
            batch_size=batch_size,
            class_weight=class_weight,
            verbose=1,
        )

    if epochs > 0:
        for layer in model.layers:
            layer.trainable = True
        _compile_classifier(model, learning_rate)
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

    # Restore pretrained classifier columns for classes absent from fine-tuning data
    present_targets = set(unique_classes.tolist())
    out_layer = model.layers[-1]
    w_final, b_final = out_layer.get_weights()
    restored_any = False
    for t_idx in shared_map:
        if t_idx not in present_targets:
            w_final[:, t_idx] = w_init[:, t_idx]
            b_final[t_idx] = b_init[t_idx]
            restored_any = True
    if restored_any:
        out_layer.set_weights([w_final, b_final])

    test_loss, test_acc = model.evaluate(splits.X_test, splits.y_test, verbose=0)
    y_pred = np.argmax(model.predict(splits.X_test, verbose=0), axis=1)

    present_test = sorted(np.unique(splits.y_test).tolist())
    present_names = [resolved_classes[i] for i in present_test]
    report = classification_report(
        splits.y_test,
        y_pred,
        labels=present_test,
        target_names=present_names,
        zero_division=0,
    )

    tflite_path = export_tflite_f32(model, tflite_out)
    labels_path = save_labels_json(resolved_classes, labels_out)
    tfjs_model_path = export_tfjs_layers(model, resolved_classes, tfjs_dir) if tfjs_dir else None

    if public_models_dir is not None:
        pub_dir = Path(public_models_dir)
        pub_dir.mkdir(parents=True, exist_ok=True)
        export_tfjs_layers(model, resolved_classes, pub_dir)
        pub_tflite = pub_dir / tflite_path.name
        if pub_tflite.resolve() != tflite_path.resolve():
            shutil.copy2(tflite_path, pub_tflite)

    return TrainResult(
        test_loss=float(test_loss),
        test_accuracy=float(test_acc),
        report=report,
        tflite_path=tflite_path,
        labels_path=labels_path,
        tfjs_model_path=tfjs_model_path,
    )
