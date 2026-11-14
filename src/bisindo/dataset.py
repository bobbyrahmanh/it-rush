"""Dataset loading, anti-leakage grouping, merging, and splitting for BISINDO landmarks."""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import numpy as np
from sklearn.model_selection import GroupShuffleSplit, StratifiedGroupKFold, train_test_split

from bisindo.features import FEATURE_DIM

_RF_HASH_RE = re.compile(r"\.rf\.[a-zA-Z0-9]+$")
_AUG_PREFIX_RE = re.compile(r"^(?:augmented_image_|aug_|flip_|flipped_|rot\d*_|rotate\d*_)+", re.IGNORECASE)
_AUG_SUFFIX_RE = re.compile(
    r"(?:_flip(?:ped)?|_rot(?:ate)?\d*|_aug\d*|_bright\d*|_blur\d*|_noise\d*|_mirror)+$",
    re.IGNORECASE,
)


@dataclass(frozen=True)
class DatasetSplits:
    X_train: np.ndarray
    y_train: np.ndarray
    X_val: np.ndarray
    y_val: np.ndarray
    X_test: np.ndarray
    y_test: np.ndarray


def extract_base_group_id(filename: str) -> str:
    """Derive a canonical group ID so augmented variants stay together in splits."""
    stem = Path(filename).stem
    stem = _RF_HASH_RE.sub("", stem)
    # Strip both stem and inner filename prefixes/suffixes iteratively
    prev = None
    while prev != stem:
        prev = stem
        stem = _AUG_PREFIX_RE.sub("", stem)
        stem = _AUG_SUFFIX_RE.sub("", stem)
    return stem or Path(filename).stem


def save_landmarks_npz(
    path: str | Path,
    X: np.ndarray,
    labels: np.ndarray,
    groups: np.ndarray | None = None,
) -> Path:
    """Save 86-dim landmark features, string class labels, and optional group IDs to NPZ."""
    out_path = Path(path)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    X_arr = np.asarray(X, dtype=np.float32)
    y_arr = np.asarray(labels, dtype=str)
    if X_arr.ndim != 2 or X_arr.shape[1] != FEATURE_DIM:
        raise ValueError(f"Expected X shape (N, {FEATURE_DIM}), got {X_arr.shape}")
    if len(X_arr) != len(y_arr):
        raise ValueError(f"Mismatched lengths: X={len(X_arr)}, labels={len(y_arr)}")

    payload: dict[str, np.ndarray] = {"X": X_arr, "y": y_arr}
    if groups is not None:
        g_arr = np.asarray(groups, dtype=str)
        if len(g_arr) != len(X_arr):
            raise ValueError(f"Mismatched lengths: X={len(X_arr)}, groups={len(g_arr)}")
        payload["groups"] = g_arr

    np.savez_compressed(out_path, **payload)
    return out_path


def load_landmarks_npz(path: str | Path) -> tuple[np.ndarray, np.ndarray]:
    """Load 86-dim landmark features and string class labels from NPZ."""
    data = np.load(Path(path), allow_pickle=False)
    X = data["X"].astype(np.float32)
    y = data["y"].astype(str)
    return X, y


def load_landmarks_with_groups(
    path: str | Path,
) -> tuple[np.ndarray, np.ndarray, np.ndarray | None]:
    """Load features, labels, and optional group IDs from NPZ."""
    data = np.load(Path(path), allow_pickle=False)
    X = data["X"].astype(np.float32)
    y = data["y"].astype(str)
    groups = data["groups"].astype(str) if "groups" in data.files else None
    return X, y, groups


def merge_datasets(
    npz_paths: Iterable[str | Path],
    classes: list[str],
) -> tuple[np.ndarray, np.ndarray]:
    """Merge multiple landmark NPZ files and map string labels to class indices."""
    X, y, _ = merge_datasets_with_groups(npz_paths, classes)
    return X, y


def merge_datasets_with_groups(
    npz_paths: Iterable[str | Path],
    classes: list[str],
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Merge NPZ datasets and return `(X, y_indices, group_ids)`."""
    label_to_idx = {label: idx for idx, label in enumerate(classes)}
    all_X: list[np.ndarray] = []
    all_y: list[np.ndarray] = []
    all_g: list[np.ndarray] = []

    for src_idx, p in enumerate(npz_paths):
        path = Path(p)
        if not path.exists():
            continue
        X, y_str, groups = load_landmarks_with_groups(path)
        valid_mask = np.array([lbl in label_to_idx for lbl in y_str], dtype=bool)
        if not np.any(valid_mask):
            continue

        if groups is None:
            file_groups = np.array(
                [f"src{src_idx}_{i}" for i in range(len(X))], dtype=str
            )
        else:
            file_groups = np.array(
                [f"src{src_idx}_{g}" for g in groups], dtype=str
            )

        all_X.append(X[valid_mask])
        all_y.append(
            np.array([label_to_idx[lbl] for lbl in y_str[valid_mask]], dtype=np.int64)
        )
        all_g.append(file_groups[valid_mask])

    if not all_X:
        raise ValueError("No valid samples found across provided NPZ paths.")

    return (
        np.concatenate(all_X, axis=0),
        np.concatenate(all_y, axis=0),
        np.concatenate(all_g, axis=0),
    )


def _split_two_way(
    X: np.ndarray,
    y: np.ndarray,
    test_size: float,
    seed: int,
    groups: np.ndarray | None,
) -> tuple[np.ndarray, np.ndarray]:
    """Return `(keep_idx, holdout_idx)` using group-aware stratification when possible."""
    all_idx = np.arange(len(X))
    if groups is None or len(np.unique(groups)) == len(X):
        keep_idx, hold_idx = train_test_split(
            all_idx, test_size=test_size, stratify=y, random_state=seed
        )
        return keep_idx, hold_idx

    n_splits = max(2, min(len(np.unique(groups)), round(1.0 / test_size)))
    _, class_counts = np.unique(y, return_counts=True)
    # Check if every class has at least 2 distinct groups to allow StratifiedGroupKFold
    min_groups_per_class = min(
        len(np.unique(groups[y == cls])) for cls in np.unique(y)
    )
    if min_groups_per_class >= 2 and n_splits <= min_groups_per_class:
        sgkf = StratifiedGroupKFold(n_splits=n_splits, shuffle=True, random_state=seed)
        keep_idx, hold_idx = next(sgkf.split(X, y, groups))
        return keep_idx, hold_idx

    gss = GroupShuffleSplit(n_splits=1, test_size=test_size, random_state=seed)
    keep_idx, hold_idx = next(gss.split(X, y, groups))
    return keep_idx, hold_idx


def split_dataset(
    X: np.ndarray,
    y: np.ndarray,
    val_split: float = 0.15,
    test_split: float = 0.15,
    seed: int = 42,
    groups: np.ndarray | None = None,
) -> DatasetSplits:
    """Create stratified (and optionally group-isolated) train / val / test splits."""
    if val_split <= 0 or test_split <= 0 or (val_split + test_split) >= 1.0:
        raise ValueError("val_split and test_split must be > 0 and sum to < 1.0")

    rem_idx, test_idx = _split_two_way(X, y, test_split, seed, groups)
    val_ratio_of_rem = val_split / (1.0 - test_split)
    rem_groups = groups[rem_idx] if groups is not None else None
    train_rel, val_rel = _split_two_way(
        X[rem_idx], y[rem_idx], val_ratio_of_rem, seed, rem_groups
    )

    train_idx = rem_idx[train_rel]
    val_idx = rem_idx[val_rel]

    return DatasetSplits(
        X_train=X[train_idx],
        y_train=y[train_idx],
        X_val=X[val_idx],
        y_val=y[val_idx],
        X_test=X[test_idx],
        y_test=y[test_idx],
    )
