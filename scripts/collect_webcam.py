"""Interactive webcam collector for BISINDO alphabet (A-Z + NOTHING) landmarks.

Controls:
  SPACE : Capture single frame (if hands detected)
  R     : Toggle continuous recording
  N / P : Next / Previous class
  S     : Save collected samples to NPZ (merges with existing webcam NPZ)
  Q/ESC : Save & Quit
"""

from __future__ import annotations

import argparse
from collections import Counter
from datetime import datetime
from pathlib import Path

import cv2
import numpy as np
import yaml

from bisindo.dataset import append_landmarks_npz, load_landmarks_npz
from bisindo.landmarks import create_hands_detector, extract_features_from_bgr


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Collect BISINDO hand landmarks via webcam")
    parser.add_argument("--config", type=Path, default=Path("configs/config.yaml"))
    parser.add_argument("--output", type=Path, default=None, help="Override webcam_npz")
    parser.add_argument("--camera", type=int, default=0, help="Webcam device index")
    parser.add_argument(
        "--class-name",
        type=str,
        default=None,
        help="Jump directly to a class label (existing or new custom class)",
    )
    return parser.parse_args()


def _draw_hands(frame: np.ndarray, hands_xy: list[np.ndarray]) -> None:
    h, w = frame.shape[:2]
    for idx, pts in enumerate(hands_xy):
        color = (0, 255, 0) if idx == 0 else (255, 200, 0)
        for x, y in pts:
            cv2.circle(frame, (int(x * w), int(y * h)), 4, color, -1)


def _save_merged(
    out_path: Path,
    X_new: list[np.ndarray],
    y_new: list[str],
    g_new: list[str],
) -> int:
    if not X_new:
        return 0
    X_arr = np.stack(X_new, axis=0)
    y_arr = np.array(y_new, dtype=str)
    g_arr = np.array(g_new, dtype=str)
    return append_landmarks_npz(out_path, X_arr, y_arr, groups_new=g_arr)


def main() -> None:
    args = parse_args()
    cfg = yaml.safe_load(args.config.read_text(encoding="utf-8"))
    classes: list[str] = list(cfg["classes"])
    out_path = args.output or Path(cfg["paths"]["webcam_npz"])

    class_idx = 0
    if args.class_name:
        target = args.class_name.strip().upper()
        if target not in classes:
            classes.append(target)
        class_idx = classes.index(target)

    cap = cv2.VideoCapture(args.camera)
    if not cap.isOpened():
        raise RuntimeError(f"Could not open webcam index {args.camera}")

    detector = create_hands_detector(static_image_mode=False, min_detection_confidence=0.3)
    session_tag = datetime.now().strftime("%Y%m%d_%H%M%S")
    burst_id = 0
    recording = False
    X_buf: list[np.ndarray] = []
    y_buf: list[str] = []
    g_buf: list[str] = []
    counts: Counter[str] = Counter()

    if out_path.exists():
        _, y_existing = load_landmarks_npz(out_path)
        counts.update(y_existing.tolist())

    try:
        while True:
            ok, frame = cap.read()
            if not ok:
                break

            frame = cv2.flip(frame, 1)
            res = extract_features_from_bgr(frame, detector)
            _draw_hands(frame, res.hands_xy)

            current_label = classes[class_idx]
            if recording and res.features is not None:
                X_buf.append(res.features)
                y_buf.append(current_label)
                g_buf.append(f"webcam_{current_label}_{session_tag}_b{burst_id}")
                counts[current_label] += 1

            status = "REC ON" if recording else "PAUSED"
            cv2.putText(
                frame,
                f"Class: {current_label} (total: {counts[current_label]}) | {status}",
                (16, 36),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.8,
                (0, 0, 255) if recording else (255, 255, 255),
                2,
            )
            cv2.putText(
                frame,
                f"Hands: {res.num_hands} | [SPACE] snap [R] rec [N/P] class [S] save [Q] quit",
                (16, 68),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.55,
                (220, 220, 220),
                1,
            )
            cv2.imshow("BISINDO Webcam Collector", frame)

            key = cv2.waitKey(1) & 0xFF
            if key in (ord("q"), 27):
                break
            elif key == ord(" "):
                if res.features is not None:
                    burst_id += 1
                    X_buf.append(res.features)
                    y_buf.append(current_label)
                    g_buf.append(f"webcam_{current_label}_{session_tag}_b{burst_id}")
                    counts[current_label] += 1
            elif key == ord("r"):
                burst_id += 1
                recording = not recording
            elif key == ord("n"):
                burst_id += 1
                class_idx = (class_idx + 1) % len(classes)
            elif key == ord("p"):
                burst_id += 1
                class_idx = (class_idx - 1) % len(classes)
            elif key == ord("s"):
                burst_id += 1
                total = _save_merged(out_path, X_buf, y_buf, g_buf)
                X_buf.clear()
                y_buf.clear()
                g_buf.clear()
                print(f"Saved! Total samples in {out_path}: {total}")
    finally:
        total = _save_merged(out_path, X_buf, y_buf, g_buf)
        if total:
            print(f"Saved on exit! Total samples in {out_path}: {total}")
        detector.close()
        cap.release()
        cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
