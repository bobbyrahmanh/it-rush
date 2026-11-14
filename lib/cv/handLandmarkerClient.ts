/**
 * Browser MediaPipe HandLandmarker wrapper (numHands: 2) and canvas overlay renderer.
 */

import type { HandLandmarker as HandLandmarkerType, HandLandmarkerResult } from "@mediapipe/tasks-vision";
import type { NormalizedLandmark2D } from "./normalizeLandmarks";

const LOCAL_WASM_BASE = "/models/mediapipe/wasm";
const LOCAL_MODEL_PATH = "/models/mediapipe/hand_landmarker.task";

const CDN_WASM_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/wasm";
const CDN_MODEL_PATH =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

const HAND_CONNECTIONS: ReadonlyArray<readonly [number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8],       // Index
  [5, 9], [9, 10], [10, 11], [11, 12],  // Middle
  [9, 13], [13, 14], [14, 15], [15, 16],// Ring
  [13, 17], [0, 17], [17, 18], [18, 19], [19, 20], // Pinky & palm
];

let landmarkerPromise: Promise<HandLandmarkerType> | null = null;

async function createLandmarkerWithSource(
  wasmBase: string,
  modelPath: string,
): Promise<HandLandmarkerType> {
  const { FilesetResolver, HandLandmarker } = await import("@mediapipe/tasks-vision");
  const fileset = await FilesetResolver.forVisionTasks(wasmBase);

  const baseOptions = {
    modelAssetPath: modelPath,
  };

  try {
    return await HandLandmarker.createFromOptions(fileset, {
      baseOptions: { ...baseOptions, delegate: "GPU" },
      runningMode: "VIDEO",
      numHands: 2,
      minHandDetectionConfidence: 0.45,
      minHandPresenceConfidence: 0.45,
      minTrackingConfidence: 0.45,
    });
  } catch {
    return await HandLandmarker.createFromOptions(fileset, {
      baseOptions: { ...baseOptions, delegate: "CPU" },
      runningMode: "VIDEO",
      numHands: 2,
      minHandDetectionConfidence: 0.45,
      minHandPresenceConfidence: 0.45,
      minTrackingConfidence: 0.45,
    });
  }
}

/**
 * Load and cache MediaPipe HandLandmarker configured for 2-hand BISINDO detection.
 * Prefers local `/models/mediapipe/` assets and falls back to official CDNs.
 */
export function loadHandLandmarker(): Promise<HandLandmarkerType> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      try {
        return await createLandmarkerWithSource(LOCAL_WASM_BASE, LOCAL_MODEL_PATH);
      } catch {
        return await createLandmarkerWithSource(CDN_WASM_BASE, CDN_MODEL_PATH);
      }
    })().catch((err) => {
      landmarkerPromise = null;
      throw err;
    });
  }
  return landmarkerPromise;
}

/**
 * Run 2-hand landmark detection on an HTMLVideoElement frame.
 */
export function detectVideoHands(
  landmarker: HandLandmarkerType,
  video: HTMLVideoElement,
  timestampMs: number,
): HandLandmarkerResult {
  return landmarker.detectForVideo(video, timestampMs);
}

/**
 * Draw 21-point hand skeletons onto an overlay 2D canvas.
 */
export function drawHandLandmarks(
  ctx: CanvasRenderingContext2D,
  hands: ReadonlyArray<ReadonlyArray<NormalizedLandmark2D>>,
  width: number,
  height: number,
  mirror = false,
): void {
  ctx.clearRect(0, 0, width, height);
  if (hands.length === 0) return;

  const palette = ["#22C55E", "#38BDF8"];

  hands.forEach((landmarks, handIdx) => {
    const strokeColor = palette[handIdx % palette.length];
    ctx.lineWidth = Math.max(2, width * 0.004);
    ctx.strokeStyle = strokeColor;

    for (const [startIdx, endIdx] of HAND_CONNECTIONS) {
      const a = landmarks[startIdx];
      const b = landmarks[endIdx];
      if (!a || !b) continue;

      const ax = (mirror ? 1 - a.x : a.x) * width;
      const ay = a.y * height;
      const bx = (mirror ? 1 - b.x : b.x) * width;
      const by = b.y * height;

      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
    }

    const radius = Math.max(3, width * 0.006);
    for (let i = 0; i < landmarks.length; i++) {
      const lm = landmarks[i];
      const cx = (mirror ? 1 - lm.x : lm.x) * width;
      const cy = lm.y * height;

      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = i === 0 ? "#FACC15" : "#FFFFFF";
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "#111827";
      ctx.stroke();
    }
  });
}
