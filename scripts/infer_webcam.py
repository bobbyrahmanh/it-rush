"""Real-time BISINDO Alphabet webcam inference using the exported TFLite model."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import cv2
import numpy as np
import tensorflow as tf
import yaml

from bisindo.landmarks import create_hands_detector, extract_features_from_bgr


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Real-time BISINDO webcam inference")
    parser.add_argument("--config", type=Path, default=Path("configs/config.yaml"))
    parser.add_argument("--model", type=Path, default=None, help="Override .tflite path")
    parser.add_argument("--labels", type=Path, default=None, help="Override labels.json path")
    parser.add_argument("--camera", type=int, default=0)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    cfg = yaml.safe_load(args.config.read_text(encoding="utf-8"))

    model_path = args.model or Path(cfg["paths"]["tflite_model"])
    labels_path = args.labels or Path(cfg["paths"]["labels_json"])
    two_hand_thresh = float(cfg["inference"]["two_hand_threshold"])
    single_hand_thresh = float(cfg["inference"]["single_hand_threshold"])

    labels: list[str] = json.loads(labels_path.read_text(encoding="utf-8"))

    interpreter = tf.lite.Interpreter(model_path=str(model_path))
    interpreter.allocate_tensors()
    input_idx = interpreter.get_input_details()[0]["index"]
    output_idx = interpreter.get_output_details()[0]["index"]

    cap = cv2.VideoCapture(args.camera)
    if not cap.isOpened():
        raise RuntimeError(f"Could not open webcam index {args.camera}")

    detector = create_hands_detector(static_image_mode=False, min_detection_confidence=0.3)

    try:
        while True:
            ok, frame = cap.read()
            if not ok:
                break

            frame = cv2.flip(frame, 1)
            res = extract_features_from_bgr(frame, detector)

            display_text = "No sign detected"
            if res.features is not None:
                h, w = frame.shape[:2]
                for pts in res.hands_xy:
                    for x, y in pts:
                        cv2.circle(frame, (int(x * w), int(y * h)), 4, (0, 255, 0), -1)

                inp = res.features.reshape(1, -1).astype(np.float32)
                interpreter.set_tensor(input_idx, inp)
                interpreter.invoke()
                scores = interpreter.get_tensor(output_idx)[0]

                best_idx = int(np.argmax(scores))
                best_score = float(scores[best_idx])
                best_label = labels[best_idx]

                thresh = two_hand_thresh if res.num_hands >= 2 else single_hand_thresh
                if best_score >= thresh and best_label != "NOTHING":
                    display_text = f"{best_label} ({best_score * 100:.1f}%)"

            cv2.putText(
                frame,
                display_text,
                (16, 44),
                cv2.FONT_HERSHEY_SIMPLEX,
                1.2,
                (0, 255, 0),
                2,
            )
            cv2.imshow("BISINDO Alphabet TFLite Inference", frame)

            if (cv2.waitKey(1) & 0xFF) in (ord("q"), 27):
                break
    finally:
        detector.close()
        cap.release()
        cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
