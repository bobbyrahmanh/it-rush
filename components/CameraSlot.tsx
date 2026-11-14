"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { HandLandmarker } from "@mediapipe/tasks-vision";
import { speak } from "@/lib/audio";
import { loadAlphabetClassifier, type AlphabetClassifier } from "@/lib/cv/alphabetClassifier";
import { detectVideoHands, drawHandLandmarks, loadHandLandmarker } from "@/lib/cv/handLandmarkerClient";
import {
  extractBisindo86Features,
  HoldPoseValidator,
  type HoldProgressState,
} from "@/lib/cv/normalizeLandmarks";
import { useProgress } from "@/lib/storage/useProgress";

type VideoMode = "idle" | "webcam" | "simulation";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const HOLD_MS = 1500;
const CONFIDENCE_THRESHOLD = 0.7;

const EMPTY_HOLD_STATE: HoldProgressState = {
  topCandidates: [],
  bestLabel: null,
  bestConfidence: 0,
  progress: 0,
  completed: false,
};

function stopMediaStream(stream: MediaStream | null): void {
  if (!stream) return;
  stream.getTracks().forEach((track) => track.stop());
}

export default function CameraSlot({ letter }: { letter: string }) {
  const { data, markLearned } = useProgress();
  const [mode, setMode] = useState<VideoMode>("idle");
  const [simLetter, setSimLetter] = useState<string>(letter);
  const [isLoadingEngine, setIsLoadingEngine] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showLandmarks, setShowLandmarks] = useState(data.settings.showLandmarks);
  const [detectedHands, setDetectedHands] = useState(0);
  const [holdState, setHoldState] = useState<HoldProgressState>(EMPTY_HOLD_STATE);
  const [justCompleted, setJustCompleted] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const simImageRef = useRef<HTMLImageElement | null>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const classifierRef = useRef<AlphabetClassifier | null>(null);
  const validatorRef = useRef(
    new HoldPoseValidator({
      holdMs: HOLD_MS,
      minFrames: 5,
      confidenceThreshold: CONFIDENCE_THRESHOLD,
      smoothWindow: 4,
    }),
  );

  const rafRef = useRef<number | null>(null);
  const lastDetectTsRef = useRef<number>(0);
  const targetLetterRef = useRef(letter);
  const showLandmarksRef = useRef(showLandmarks);
  const audioEnabledRef = useRef(data.settings.audioEnabled);
  const celebratedRef = useRef(false);
  const isMountedRef = useRef(true);

  targetLetterRef.current = letter;
  showLandmarksRef.current = showLandmarks;
  audioEnabledRef.current = data.settings.audioEnabled;

  // Reset hold progress whenever the target letter changes.
  useEffect(() => {
    setSimLetter(letter);
    validatorRef.current.reset();
    celebratedRef.current = false;
    setJustCompleted(false);
    setHoldState(EMPTY_HOLD_STATE);
  }, [letter]);

  // Load chosen simulation sample image into ref whenever `simLetter` updates.
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = `/samples/bisindo/${simLetter}.jpg`;
    img.onload = () => {
      simImageRef.current = img;
    };
  }, [simLetter]);

  const stopAll = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    stopMediaStream(activeStreamRef.current);
    activeStreamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    const canvas = overlayCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
    validatorRef.current.reset();
    celebratedRef.current = false;
    setDetectedHands(0);
    setHoldState(EMPTY_HOLD_STATE);
    setJustCompleted(false);
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      stopAll();
    };
  }, [stopAll]);

  const ensureAiEngine = useCallback(async () => {
    if (landmarkerRef.current && classifierRef.current) {
      return { landmarker: landmarkerRef.current, classifier: classifierRef.current };
    }
    setIsLoadingEngine(true);
    try {
      const [landmarker, classifier] = await Promise.all([
        loadHandLandmarker(),
        loadAlphabetClassifier(),
      ]);
      landmarkerRef.current = landmarker;
      classifierRef.current = classifier;
      return { landmarker, classifier };
    } finally {
      if (isMountedRef.current) {
        setIsLoadingEngine(false);
      }
    }
  }, []);

  const startDetectionLoop = useCallback((activeMode: VideoMode) => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    const tick = (rafTime: number) => {
      const video = videoRef.current;
      const overlay = overlayCanvasRef.current;
      const landmarker = landmarkerRef.current;
      const classifier = classifierRef.current;

      // Keep offscreen simulation canvas streaming fresh frames.
      if (activeMode === "simulation" && offscreenCanvasRef.current && simImageRef.current) {
        const off = offscreenCanvasRef.current;
        const offCtx = off.getContext("2d");
        const img = simImageRef.current;
        if (offCtx && img.complete && img.naturalWidth > 0) {
          const dx = Math.sin(rafTime * 0.002) * 2;
          const dy = Math.cos(rafTime * 0.0017) * 2;
          offCtx.fillStyle = "#18181B";
          offCtx.fillRect(0, 0, off.width, off.height);
          offCtx.drawImage(img, dx, dy, off.width, off.height);
        }
      }

      if (
        video &&
        overlay &&
        landmarker &&
        classifier &&
        video.readyState >= 2 &&
        video.videoWidth > 0 &&
        video.videoHeight > 0
      ) {
        if (overlay.width !== video.videoWidth || overlay.height !== video.videoHeight) {
          overlay.width = video.videoWidth;
          overlay.height = video.videoHeight;
        }

        const nowMs = Math.max(performance.now(), lastDetectTsRef.current + 1);
        lastDetectTsRef.current = nowMs;

        const result = detectVideoHands(landmarker, video, nowMs);
        const hands = result.landmarks ?? [];
        setDetectedHands(hands.length);

        const ctx = overlay.getContext("2d");
        if (ctx) {
          if (showLandmarksRef.current) {
            drawHandLandmarks(
              ctx,
              hands,
              overlay.width,
              overlay.height,
              activeMode === "webcam",
            );
          } else {
            ctx.clearRect(0, 0, overlay.width, overlay.height);
          }
        }

        const features = extractBisindo86Features(hands);
        if (features) {
          const probs = classifier.predictProbabilities(features);
          const nextState = validatorRef.current.update(
            probs,
            classifier.labels,
            targetLetterRef.current,
            nowMs,
          );
          setHoldState(nextState);

          if (nextState.completed && !celebratedRef.current) {
            celebratedRef.current = true;
            setJustCompleted(true);
            markLearned("bisindo", targetLetterRef.current, 10);
            speak(`Berhasil! Huruf ${targetLetterRef.current}`, audioEnabledRef.current);
          }
        } else {
          validatorRef.current.reset();
          setHoldState(EMPTY_HOLD_STATE);
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [markLearned]);

  const startWebcam = useCallback(async () => {
    stopAll();
    setCameraError(null);
    setMode("webcam");

    try {
      await ensureAiEngine();
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Browser ini tidak mendukung akses kamera.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        audio: false,
      });

      if (!isMountedRef.current) {
        stopMediaStream(stream);
        return;
      }

      activeStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      startDetectionLoop("webcam");
    } catch (err) {
      stopAll();
      setMode("idle");
      const message =
        err instanceof Error && err.name === "NotAllowedError"
          ? "Izin kamera ditolak oleh browser. Izinkan kamera atau coba Mode Video Simulasi."
          : err instanceof Error
            ? `Kamera tidak tersedia: ${err.message}`
            : "Kamera gagal dibuka. Gunakan Video Simulasi untuk menguji model AI.";
      setCameraError(message);
    }
  }, [ensureAiEngine, startDetectionLoop, stopAll]);

  const startSimulation = useCallback(async () => {
    stopAll();
    setCameraError(null);
    setMode("simulation");

    try {
      await ensureAiEngine();

      const canvas = offscreenCanvasRef.current ?? document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 480;
      offscreenCanvasRef.current = canvas;

      const expectedSuffix = `/samples/bisindo/${simLetter}.jpg`;
      const currentSrc = simImageRef.current?.src ?? "";
      if (!simImageRef.current || !simImageRef.current.complete || !currentSrc.endsWith(expectedSuffix)) {
        await new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = expectedSuffix;
          img.onload = () => {
            simImageRef.current = img;
            resolve();
          };
          img.onerror = () => reject(new Error(`Gagal memuat contoh foto huruf ${simLetter}.`));
        });
      }

      const offCtx = canvas.getContext("2d");
      if (offCtx && simImageRef.current) {
        offCtx.drawImage(simImageRef.current, 0, 0, canvas.width, canvas.height);
      }

      if (typeof canvas.captureStream !== "function") {
        throw new Error("Browser tidak mendukung canvas captureStream untuk simulasi video.");
      }

      const stream = canvas.captureStream(30);
      if (!isMountedRef.current) {
        stopMediaStream(stream);
        return;
      }

      activeStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      startDetectionLoop("simulation");
    } catch (err) {
      stopAll();
      setMode("idle");
      setCameraError(err instanceof Error ? err.message : "Gagal menjalankan video simulasi.");
    }
  }, [ensureAiEngine, simLetter, startDetectionLoop, stopAll]);

  const handleStop = useCallback(() => {
    stopAll();
    setCameraError(null);
    setMode("idle");
  }, [stopAll]);

  const isAlreadyLearned = data.bisindo.learnedLetters.includes(letter);
  const holdPercent = Math.round(holdState.progress * 100);

  return (
    <div className="card overflow-hidden bg-ink p-5 text-white">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border-2 border-white/20 bg-black/50">
        <video
          ref={videoRef}
          muted
          playsInline
          autoPlay
          className={`h-full w-full object-contain ${mode === "webcam" ? "-scale-x-100" : ""} ${mode === "idle" ? "hidden" : "block"}`}
        />
        <canvas
          ref={overlayCanvasRef}
          className={`pointer-events-none absolute inset-0 h-full w-full object-contain ${mode === "idle" ? "hidden" : "block"}`}
        />

        {mode !== "idle" && (
          <div className="pointer-events-none absolute inset-x-3 top-3 flex flex-wrap items-center justify-between gap-2">
            <span
              className={`inline-flex items-center gap-2 rounded-full border-2 border-ink px-3 py-1 text-xs font-bold ${
                mode === "webcam" ? "bg-coral text-white" : "bg-sun text-ink"
              }`}
            >
              <span className="h-2.5 w-2.5 rounded-full bg-current" aria-hidden="true" />
              {mode === "webcam" ? "LIVE WEBCAM" : `MODE SIMULASI (${simLetter})`}
            </span>
            <span className="rounded-full border-2 border-ink bg-white px-3 py-1 text-xs font-bold text-ink">
              {detectedHands === 0 ? "Belum ada tangan" : `${detectedHands} Tangan Terbaca`}
            </span>
          </div>
        )}

        {mode !== "idle" && !isLoadingEngine && detectedHands === 0 && (
          <div className="pointer-events-none absolute inset-x-4 bottom-4 rounded-xl border-2 border-white/20 bg-ink/85 px-4 py-2 text-center text-sm text-white">
            Arahkan 1 atau 2 tangan ke dalam kotak kamera
          </div>
        )}

        {isLoadingEngine && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink/90 p-6 text-center">
            <div
              className="h-10 w-10 animate-spin rounded-full border-4 border-sun border-t-transparent"
              aria-hidden="true"
            />
            <p className="font-display text-lg font-semibold">Memuat model AI MediaPipe &amp; BISINDO...</p>
            <p className="text-sm text-white/80">Semua pemrosesan berjalan langsung di browser perangkatmu.</p>
          </div>
        )}

        {mode === "idle" && !isLoadingEngine && (
          <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
            <p className="font-display text-xl font-semibold">Area kamera untuk huruf {letter}</p>
            <p className="max-w-sm text-sm text-white/90">
              Video diproses di perangkatmu menggunakan MediaPipe dan model TensorFlow.js, tidak dikirim ke server mana pun.
            </p>

            {cameraError && (
              <div role="alert" className="max-w-md rounded-2xl border-2 border-coral bg-coral/20 px-4 py-3 text-sm text-white">
                {cameraError}
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-3">
              <button type="button" onClick={startWebcam} className="btn bg-sun text-ink">
                Gunakan Kamera
              </button>
              <button type="button" onClick={startSimulation} className="btn bg-white text-ink">
                Gunakan Video Simulasi
              </button>
            </div>
          </div>
        )}
      </div>

      {mode !== "idle" && (
        <div className="mt-4 space-y-4">
          {justCompleted ? (
            <div
              role="status"
              aria-live="polite"
              className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border-2 border-ink bg-mint px-4 py-3 text-ink"
            >
              <span className="font-display text-lg font-bold">
                Huruf {letter} Berhasil Dikuasai! (+10 XP)
              </span>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold">SELESAI</span>
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-white/20 bg-white/10 p-3">
              <div className="flex items-center justify-between text-sm font-semibold">
                <span>
                  Target: Huruf <strong className="text-sun">{letter}</strong>
                  {isAlreadyLearned ? " (Sudah Dikuasai)" : ""}
                </span>
                <span>{holdPercent}% (Tahan 1,5 dtk)</span>
              </div>
              <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-black/50">
                <div
                  className="h-full rounded-full bg-mint transition-all duration-100"
                  style={{ width: `${holdPercent}%` }}
                />
              </div>
            </div>
          )}

          <div className="rounded-2xl border-2 border-white/20 bg-white/10 p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/75">
              Prediksi Model AI Secara Langsung
            </p>
            {holdState.topCandidates.length > 0 ? (
              <div className="mt-2 grid grid-cols-3 gap-2">
                {holdState.topCandidates.map((cand, idx) => {
                  const pct = Math.round(cand.confidence * 100);
                  const isTarget = cand.label === letter;
                  return (
                    <div
                      key={cand.label}
                      className={`rounded-xl border-2 px-3 py-2 text-center ${
                        isTarget
                          ? "border-mint bg-mint/20 text-white"
                          : idx === 0
                            ? "border-sun/70 bg-white/10 text-white"
                            : "border-white/15 bg-black/30 text-white/80"
                      }`}
                    >
                      <div className="font-display text-xl font-bold">{cand.label}</div>
                      <div className="text-xs font-semibold">{pct}%</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-1 text-sm text-white/75">Menunggu deteksi tangan dari kamera...</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowLandmarks((prev) => !prev)}
              className="btn !min-h-[44px] !px-4 !text-sm bg-white text-ink"
            >
              {showLandmarks ? "Sembunyikan Titik Jari" : "Tampilkan Titik Jari"}
            </button>

            {mode === "webcam" ? (
              <button
                type="button"
                onClick={startSimulation}
                className="btn !min-h-[44px] !px-4 !text-sm bg-sun text-ink"
              >
                Coba Simulasi
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={startWebcam}
                  className="btn !min-h-[44px] !px-4 !text-sm bg-sun text-ink"
                >
                  Pakai Kamera
                </button>
                <label className="flex min-h-[44px] items-center gap-2 rounded-full border-2 border-white/30 bg-white/10 px-3 text-sm font-semibold">
                  <span>Klip:</span>
                  <select
                    aria-label="Pilih huruf video simulasi"
                    value={simLetter}
                    onChange={(e) => {
                      validatorRef.current.reset();
                      setSimLetter(e.target.value);
                    }}
                    className="rounded-lg bg-ink px-2 py-1 text-white"
                  >
                    {ALPHABET.map((l) => (
                      <option key={l} value={l}>
                        Huruf {l}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}

            <button
              type="button"
              onClick={handleStop}
              className="btn !min-h-[44px] !px-4 !text-sm ml-auto bg-coral text-white"
            >
              Matikan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
