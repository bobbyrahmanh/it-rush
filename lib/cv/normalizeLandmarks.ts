/**
 * BISINDO 86-dim Bohacek hand landmark normalization & hold-time validator.
 *
 * Mathematically identical to `src/bisindo/features.py`:
 *   [0..41]   Leftmost hand on screen: 21 x (x, y) Bohacek-normalized to [0, 1]
 *   [42..83]  Rightmost hand on screen: 21 x (x, y) Bohacek-normalized, or 0.0
 *   [84]      dx = mean_x(right) - mean_x(left) (>= 0 for two hands, 0.0 for single)
 *   [85]      dy = mean_y(right) - mean_y(left) (0.0 for single)
 */

export interface NormalizedLandmark2D {
  x: number;
  y: number;
  z?: number;
}

export const NUM_LANDMARKS = 21;
export const NUM_HAND_FEATURES = NUM_LANDMARKS * 2; // 42
export const FEATURE_DIM = NUM_HAND_FEATURES * 2 + 2; // 86
const EPS = 1e-6;

/**
 * Apply Bohacek bounding-box normalization to 21 hand landmarks.
 * Returns a 42-element Float32Array with values in [0, 1].
 */
export function normalizeHandBohacek(landmarks: ReadonlyArray<NormalizedLandmark2D>): Float32Array {
  if (landmarks.length < NUM_LANDMARKS) {
    throw new Error(`Expected at least ${NUM_LANDMARKS} landmarks, got ${landmarks.length}`);
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (let i = 0; i < NUM_LANDMARKS; i++) {
    const { x, y } = landmarks[i];
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  const spanX = Math.max(Math.abs(maxX - minX), EPS);
  const spanY = Math.max(Math.abs(maxY - minY), EPS);

  const norm = new Float32Array(NUM_HAND_FEATURES);
  for (let i = 0; i < NUM_LANDMARKS; i++) {
    norm[i * 2] = (landmarks[i].x - minX) / spanX;
    norm[i * 2 + 1] = (landmarks[i].y - minY) / spanY;
  }
  return norm;
}

function meanXY(landmarks: ReadonlyArray<NormalizedLandmark2D>): { cx: number; cy: number } {
  let sumX = 0;
  let sumY = 0;
  for (let i = 0; i < NUM_LANDMARKS; i++) {
    sumX += landmarks[i].x;
    sumY += landmarks[i].y;
  }
  return { cx: sumX / NUM_LANDMARKS, cy: sumY / NUM_LANDMARKS };
}

/**
 * Build an 86-dim feature vector from two detected hands (sorted left-to-right by mean x).
 */
export function buildTwoHandFeatures(
  handA: ReadonlyArray<NormalizedLandmark2D>,
  handB: ReadonlyArray<NormalizedLandmark2D>,
): Float32Array {
  const meanA = meanXY(handA);
  const meanB = meanXY(handB);

  const [leftHand, leftMean, rightHand, rightMean] =
    meanA.cx <= meanB.cx ? [handA, meanA, handB, meanB] : [handB, meanB, handA, meanA];

  const leftNorm = normalizeHandBohacek(leftHand);
  const rightNorm = normalizeHandBohacek(rightHand);

  const out = new Float32Array(FEATURE_DIM);
  out.set(leftNorm, 0);
  out.set(rightNorm, NUM_HAND_FEATURES);
  out[84] = rightMean.cx - leftMean.cx; // >= 0
  out[85] = rightMean.cy - leftMean.cy;
  return out;
}

/**
 * Build an 86-dim feature vector from a single detected hand (zero-pads second slot).
 */
export function buildSingleHandFeatures(
  hand: ReadonlyArray<NormalizedLandmark2D>,
): Float32Array {
  const handNorm = normalizeHandBohacek(hand);
  const out = new Float32Array(FEATURE_DIM);
  out.set(handNorm, 0);
  return out;
}

/**
 * Convert MediaPipe HandLandmarker `results.landmarks` (0, 1, or 2 hands) to 86 features.
 * Returns null if no hands are detected.
 */
export function extractBisindo86Features(
  hands: ReadonlyArray<ReadonlyArray<NormalizedLandmark2D>>,
): Float32Array | null {
  if (hands.length === 0) return null;
  if (hands.length >= 2) {
    return buildTwoHandFeatures(hands[0], hands[1]);
  }
  return buildSingleHandFeatures(hands[0]);
}

export interface PredictionCandidate {
  label: string;
  confidence: number;
}

export interface HoldProgressState {
  topCandidates: PredictionCandidate[];
  bestLabel: string | null;
  bestConfidence: number;
  progress: number; // 0..1
  completed: boolean;
}

/**
 * FPS-independent pose hold validator & 4-frame exploration probability smoother.
 */
export class HoldPoseValidator {
  private readonly holdMs: number;
  private readonly minFrames: number;
  private readonly confidenceThreshold: number;
  private readonly smoothWindow: number;

  private holdStartMs: number | null = null;
  private validFrameCount = 0;
  private probHistory: Float32Array[] = [];

  constructor(options?: {
    holdMs?: number;
    minFrames?: number;
    confidenceThreshold?: number;
    smoothWindow?: number;
  }) {
    this.holdMs = options?.holdMs ?? 1500;
    this.minFrames = options?.minFrames ?? 5;
    this.confidenceThreshold = options?.confidenceThreshold ?? 0.75;
    this.smoothWindow = options?.smoothWindow ?? 4;
  }

  reset(): void {
    this.holdStartMs = null;
    this.validFrameCount = 0;
    this.probHistory = [];
  }

  update(
    rawScores: ArrayLike<number>,
    labels: ReadonlyArray<string>,
    targetLabel: string | null,
    nowMs: number = performance.now(),
  ): HoldProgressState {
    const numClasses = labels.length;
    const current = new Float32Array(numClasses);
    for (let i = 0; i < numClasses; i++) current[i] = rawScores[i] ?? 0;

    this.probHistory.push(current);
    if (this.probHistory.length > this.smoothWindow) {
      this.probHistory.shift();
    }

    const averaged = new Float32Array(numClasses);
    for (const frameScores of this.probHistory) {
      for (let i = 0; i < numClasses; i++) averaged[i] += frameScores[i];
    }
    for (let i = 0; i < numClasses; i++) averaged[i] /= this.probHistory.length;

    const candidates: PredictionCandidate[] = labels
      .map((label, idx) => ({ label, confidence: averaged[idx] }))
      .filter((c) => c.label !== "NOTHING")
      .sort((a, b) => b.confidence - a.confidence);

    const best = candidates[0] ?? null;
    const isTargetMatch =
      best !== null &&
      best.confidence >= this.confidenceThreshold &&
      (targetLabel === null || best.label === targetLabel);

    if (!isTargetMatch) {
      this.holdStartMs = null;
      this.validFrameCount = 0;
      return {
        topCandidates: candidates.slice(0, 3),
        bestLabel: best?.label ?? null,
        bestConfidence: best?.confidence ?? 0,
        progress: 0,
        completed: false,
      };
    }

    if (this.holdStartMs === null) {
      this.holdStartMs = nowMs;
      this.validFrameCount = 1;
    } else {
      this.validFrameCount += 1;
    }

    const elapsed = Math.max(0, nowMs - this.holdStartMs);
    const timeProgress = this.holdMs <= 0 ? 1 : Math.min(1, elapsed / this.holdMs);
    const completed =
      this.holdMs <= 0
        ? true
        : elapsed >= this.holdMs && this.validFrameCount >= this.minFrames;

    return {
      topCandidates: candidates.slice(0, 3),
      bestLabel: best.label,
      bestConfidence: best.confidence,
      progress: timeProgress,
      completed,
    };
  }
}
