"""Dataset loading, anti-leakage grouping, merging, and splitting for BISINDO landmarks."""

from __future__ import annotations

from collections import Counter
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable, Iterable

import cv2
import numpy as np
from sklearn.model_selection import GroupShuffleSplit, StratifiedGroupKFold, train_test_split

from bisindo.features import FEATURE_DIM
from bisindo.landmarks import (
    extract_features_from_bgr,
    extract_features_with_yolo_fallback,
    parse_yolo_boxes,
)

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
VIDEO_EXTS = {".mp4", ".webm", ".avi", ".mov", ".mkv"}

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


def append_landmarks_npz(
    path: str | Path,
    X_new: np.ndarray,
    labels_new: np.ndarray,
    groups_new: np.ndarray | None = None,
) -> int:
    """Append new landmark samples to an existing NPZ (or create it) while preserving groups."""
    out_path = Path(path)
    X_arr = np.asarray(X_new, dtype=np.float32)
    y_arr = np.asarray(labels_new, dtype=str)

    if X_arr.ndim != 2 or X_arr.shape[1] != FEATURE_DIM:
        raise ValueError(f"Expected X_new shape (N, {FEATURE_DIM}), got {X_arr.shape}")
    if len(X_arr) != len(y_arr):
        raise ValueError(f"Mismatched lengths: X_new={len(X_arr)}, labels_new={len(y_arr)}")

    if out_path.exists():
        X_old, y_old, g_old = load_landmarks_with_groups(out_path)
        existing_n = len(X_old)
        if len(X_arr) == 0:
            return existing_n
        if g_old is None:
            g_old = np.array([f"old_{i}" for i in range(existing_n)], dtype=str)
        if groups_new is None:
            g_new = np.array(
                [f"append_{existing_n}_{i}" for i in range(len(X_arr))], dtype=str
            )
        else:
            g_new = np.asarray(groups_new, dtype=str)

        X_all = np.concatenate([X_old, X_arr], axis=0)
        y_all = np.concatenate([y_old, y_arr], axis=0)
        g_all = np.concatenate([g_old, g_new], axis=0)
    else:
        if groups_new is None:
            g_all = np.array([f"append_0_{i}" for i in range(len(X_arr))], dtype=str)
        else:
            g_all = np.asarray(groups_new, dtype=str)
        X_all, y_all = X_arr, y_arr

    save_landmarks_npz(out_path, X_all, y_all, groups=g_all)
    return len(X_all)


def summarize_dataset_npz(npz_paths: Iterable[str | Path]) -> dict[str, int]:
    """Return sorted per-class sample counts across all existing NPZ datasets."""
    counts: Counter[str] = Counter()
    for p in npz_paths:
        path = Path(p)
        if not path.exists():
            continue
        _, y_str, _ = load_landmarks_with_groups(path)
        counts.update(y_str.tolist())
    return {label: int(counts[label]) for label in sorted(counts)}


def extract_landmarks_from_video_file(
    video_path: str | Path,
    detector: Any,
    frame_stride: int = 3,
    max_frames: int = 100,
) -> list[np.ndarray]:
    """Sample frames from a video file and extract 86-dim BISINDO landmark features."""
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise RuntimeError(f"Could not open video file: {video_path}")

    stride = max(1, int(frame_stride))
    extracted: list[np.ndarray] = []
    frame_idx = 0
    try:
        while len(extracted) < max_frames:
            ok, frame = cap.read()
            if not ok:
                break
            if frame_idx % stride == 0:
                res = extract_features_from_bgr(frame, detector)
                if res.features is not None:
                    extracted.append(res.features)
            frame_idx += 1
    finally:
        cap.release()
    return extracted


def extract_dataset_from_directory(
    input_dir: str | Path,
    classes: set[str] | None,
    detector: Any,
    *,
    allow_new_classes: bool = False,
    frame_stride: int = 3,
    max_video_frames: int = 100,
    find_yolo_fn: Callable[[Path, Path], Path | None] | None = None,
) -> tuple[np.ndarray, np.ndarray, np.ndarray, list[str]]:
    """Extract 86-dim features from class subdirectories containing images and/or videos."""
    in_dir = Path(input_dir)
    if not in_dir.exists():
        raise FileNotFoundError(f"Input directory not found: {in_dir}")

    X_list: list[np.ndarray] = []
    y_list: list[str] = []
    groups_list: list[str] = []

    for class_dir in sorted(in_dir.iterdir()):
        if not class_dir.is_dir():
            continue
        label = class_dir.name.upper()
        if not allow_new_classes and classes is not None and label not in classes:
            continue

        for file_path in sorted(class_dir.iterdir()):
            if not file_path.is_file():
                continue
            ext = file_path.suffix.lower()
            if ext in IMAGE_EXTS:
                bgr = cv2.imread(str(file_path))
                if bgr is None:
                    continue
                label_file = find_yolo_fn(file_path, in_dir) if find_yolo_fn else None
                yolo_boxes = parse_yolo_boxes(label_file) if label_file else None
                res = extract_features_with_yolo_fallback(bgr, detector, yolo_boxes=yolo_boxes)
                if res.features is not None:
                    X_list.append(res.features)
                    y_list.append(label)
                    groups_list.append(f"{label}_{extract_base_group_id(file_path.name)}")
            elif ext in VIDEO_EXTS:
                vid_feats = extract_landmarks_from_video_file(
                    file_path,
                    detector,
                    frame_stride=frame_stride,
                    max_frames=max_video_frames,
                )
                vid_group = f"{label}_vid_{file_path.stem}"
                for feat in vid_feats:
                    X_list.append(feat)
                    y_list.append(label)
                    groups_list.append(vid_group)

    if not X_list:
        return (
            np.empty((0, FEATURE_DIM), dtype=np.float32),
            np.empty((0,), dtype=str),
            np.empty((0,), dtype=str),
            [],
        )

    X_out = np.stack(X_list, axis=0).astype(np.float32)
    y_out = np.array(y_list, dtype=str)
    g_out = np.array(groups_list, dtype=str)
    discovered = sorted(set(y_list))
    return X_out, y_out, g_out, discovered
