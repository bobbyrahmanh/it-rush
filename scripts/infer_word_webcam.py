"""Real-time / video-file BISINDO word-level inference using KawanIsyarat WL-BISINDO model.

Supported 8 words: air, belajar, hari, maaf, makan, saya, terima_kasih, tuli.

Usage:
  Webcam: press SPACE to record a 3-second sign window, Q/ESC to quit.
  Video : python scripts/infer_word_webcam.py --video path/to/sign.mp4
"""

from __future__ import annotations

import argparse
import time
from pathlib import Path

import cv2
import numpy as np
import yaml

from bisindo.landmarks import create_hands_detector
from bisindo.word_level import (
    WordLevelPredictor,
    create_pose_detector,
    extract_wl_features_from_bgr,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="BISINDO Word-Level TFLite Inference")
    parser.add_argument("--config", type=Path, default=Path("configs/config.yaml"))
    parser.add_argument("--model", type=Path, default=None, help="Override wl_tflite_model")
    parser.add_argument("--labels", type=Path, default=None, help="Override wl_labels_json")
    parser.add_argument("--video", type=Path, default=None, help="Optional video file path")
    parser.add_argument("--camera", type=int, default=0)
    parser.add_argument("--duration", type=float, default=3.0, help="Recording seconds (webcam)")
    return parser.parse_args()


def _predict_video_file(
    video_path: Path,
    predictor: WordLevelPredictor,
    hand_det,
    pose_det,
) -> None:
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise RuntimeError(f"Could not open video file: {video_path}")

    frames: list[np.ndarray] = []
    try:
        while True:
            ok, frame = cap.read()
            if not ok:
                break
            frames.append(extract_wl_features_from_bgr(frame, hand_det, pose_det))
    finally:
        cap.release()

    preds = predictor.predict(frames)
    print(f"Processed {len(frames)} frames from {video_path}:")
    for pred in preds[:3]:
        print(f"  {pred.word:<15s}: {pred.confidence * 100:.1f}%")


def _run_webcam(
    camera_index: int,
    duration_sec: float,
    predictor: WordLevelPredictor,
    hand_det,
    pose_det,
) -> None:
    cap = cv2.VideoCapture(camera_index)
    if not cap.isOpened():
        raise RuntimeError(f"Could not open webcam index {camera_index}")

    recording = False
    rec_start = 0.0
    frame_buffer: list[np.ndarray] = []
    last_label = "Tekan [SPACE] untuk rekam kata (3 detik)"

    try:
        while True:
            ok, frame = cap.read()
            if not ok:
                break

            frame = cv2.flip(frame, 1)
            now = time.monotonic()

            if recording:
                elapsed = now - rec_start
                frame_buffer.append(extract_wl_features_from_bgr(frame, hand_det, pose_det))
                pct = min(100, int((elapsed / duration_sec) * 100))
                status = f"MEREKAM... {pct}% ({len(frame_buffer)} frames)"
                color = (0, 0, 255)

                if elapsed >= duration_sec:
                    recording = False
                    preds = predictor.predict(frame_buffer)
                    top = preds[0]
                    second = preds[1] if len(preds) > 1 else None
                    if second is not None:
                        last_label = (
                            f"{top.word} ({top.confidence * 100:.1f}%) | "
                            f"{second.word} ({second.confidence * 100:.1f}%)"
                        )
                    else:
                        last_label = f"{top.word} ({top.confidence * 100:.1f}%)"
                    frame_buffer.clear()
            else:
                status = last_label
                color = (0, 255, 0)

            cv2.putText(frame, status, (16, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.85, color, 2)
            cv2.putText(
                frame,
                "[SPACE] Rekam 3s | [Q/ESC] Keluar",
                (16, 74),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (220, 220, 220),
                1,
            )
            cv2.imshow("BISINDO Word-Level Inference", frame)

            key = cv2.waitKey(1) & 0xFF
            if key in (ord("q"), 27):
                break
            if key == ord(" ") and not recording:
                frame_buffer.clear()
                rec_start = time.monotonic()
                recording = True
    finally:
        cap.release()
        cv2.destroyAllWindows()


def main() -> None:
    args = parse_args()
    cfg = yaml.safe_load(args.config.read_text(encoding="utf-8"))

    model_path = args.model or Path(cfg["paths"]["wl_tflite_model"])
    labels_path = args.labels or Path(cfg["paths"]["wl_labels_json"])

    predictor = WordLevelPredictor(model_path, labels_path)
    hand_det = create_hands_detector(static_image_mode=False, min_detection_confidence=0.3)
    pose_det = create_pose_detector(min_detection_confidence=0.3)

    try:
        if args.video is not None:
            _predict_video_file(args.video, predictor, hand_det, pose_det)
        else:
            _run_webcam(args.camera, args.duration, predictor, hand_det, pose_det)
    finally:
        hand_det.close()
        pose_det.close()


if __name__ == "__main__":
    main()
