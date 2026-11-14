"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { speak } from "@/lib/audio";
import { WORD_ITEMS, type WordItem } from "@/lib/bisindo";
import { detectVideoHands, drawHandLandmarks, loadHandLandmarker } from "@/lib/cv/handLandmarkerClient";
import type { NormalizedLandmark2D } from "@/lib/cv/normalizeLandmarks";
import {
  detectVideoPose,
  drawPoseAnchors,
  extractPoseAnchors,
  loadPoseLandmarker,
} from "@/lib/cv/poseLandmarkerClient";
import {
  extractWlFrameFeatures,
  loadWordClassifier,
  type WordPredictionCandidate,
} from "@/lib/cv/wordClassifier";
import { useProgress } from "@/lib/storage/useProgress";

type SlotMode = "idle" | "webcam" | "simulation";
type SlotStatus = "idle" | "loading" | "ready" | "error";

interface SimulationFrame {
  hands: number[][][];
  pose: number[][] | null;
}

type SimulationSequenceMap = Record<string, SimulationFrame[]>;

interface WordCameraSlotProps {
  word: WordItem;
}

const RECORD_DURATION_MS = 2500;
const MIN_RECORD_FRAMES = 6;
const SIM_FRAME_INTERVAL_MS = 45;
const WEBCAM_MATCH_THRESHOLD = 0.5;
const SIM_MATCH_THRESHOLD = 0.65;

let cachedSequencesPromise: Promise<SimulationSequenceMap> | null = null;

function loadSimulationSequences(): Promise<SimulationSequenceMap> {
  if (!cachedSequencesPromise) {
    cachedSequencesPromise = fetch("/samples/bisindo/wl_sequences.json")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Gagal memuat sampel simulasi (${res.status}).`);
        }
        return res.json() as Promise<SimulationSequenceMap>;
      })
      .catch((err) => {
        cachedSequencesPromise = null;
        throw err;
      });
  }
  return cachedSequencesPromise;
}

function toLandmarkList(points: number[][]): NormalizedLandmark2D[] {
  return points.map((pt) => ({ x: pt[0] ?? 0, y: pt[1] ?? 0 }));
}

export default function WordCameraSlot({ word }: WordCameraSlotProps) {
  const { data, markWordLearned } = useProgress();
  const [mode, setMode] = useState<SlotMode>("idle");
  const [status, setStatus] = useState<SlotStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showLandmarks, setShowLandmarks] = useState<boolean>(data.settings.showLandmarks);
  const [simSampleWord, setSimSampleWord] = useState<string>(word.id);
  const [simFrameIndex, setSimFrameIndex] = useState<number>(0);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordProgress, setRecordProgress] = useState<number>(0);
  const [handDetected, setHandDetected] = useState<boolean>(false);
  const [poseDetected, setPoseDetected] = useState<boolean>(false);
  const [predictions, setPredictions] = useState<WordPredictionCandidate[]>([]);
  const [matched, setMatched] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const showLandmarksRef = useRef<boolean>(showLandmarks);
  const audioEnabledRef = useRef<boolean>(data.settings.audioEnabled);
  const isRecordingRef = useRef<boolean>(false);
  const recordStartRef = useRef<number>(0);
  const recordedFramesRef = useRef<Float32Array[]>([]);
  const classifierRef = useRef<Awaited<ReturnType<typeof loadWordClassifier>> | null>(null);
  const lastVideoTsRef = useRef<number>(0);
  const lastVideoTimeRef = useRef<number>(-1);
  const celebratedRef = useRef<boolean>(false);

  useEffect(() => {
    showLandmarksRef.current = showLandmarks;
  }, [showLandmarks]);

  useEffect(() => {
    audioEnabledRef.current = data.settings.audioEnabled;
  }, [data.settings.audioEnabled]);

  const stopMediaStream = useCallback(() => {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const resetPracticeState = useCallback(() => {
    isRecordingRef.current = false;
    recordedFramesRef.current = [];
    celebratedRef.current = false;
    setIsRecording(false);
    setRecordProgress(0);
    setPredictions([]);
    setMatched(false);
    setHandDetected(false);
    setPoseDetected(false);
    setErrorMsg(null);
  }, []);

  useEffect(() => {
    setSimSampleWord(word.id);
    setSimFrameIndex(0);
    resetPracticeState();
  }, [word.id, resetPracticeState]);

  const handlePredictions = useCallback(
    (candidates: WordPredictionCandidate[], threshold: number) => {
      setPredictions(candidates.slice(0, 3));
      const top = candidates[0];
      const isMatch = Boolean(top && top.word === word.id && top.confidence >= threshold);
      setMatched(isMatch);
      if (isMatch && !celebratedRef.current) {
        celebratedRef.current = true;
        markWordLearned(word.id, 15);
        speak(`Bagus! Gerakan kata ${word.title} berhasil dikenali.`, audioEnabledRef.current);
      }
    },
    [markWordLearned, word.id, word.title],
  );

  const startRecording = useCallback(() => {
    if (mode !== "webcam" || status !== "ready" || isRecordingRef.current) return;
    recordedFramesRef.current = [];
    recordStartRef.current = performance.now();
    celebratedRef.current = false;
    isRecordingRef.current = true;
    setMatched(false);
    setPredictions([]);
    setRecordProgress(0);
    setIsRecording(true);
  }, [mode, status]);

  const switchMode = useCallback(
    (nextMode: SlotMode) => {
      stopMediaStream();
      resetPracticeState();
      setSimFrameIndex(0);
      setStatus(nextMode === "idle" ? "idle" : "loading");
      setMode(nextMode);
    },
    [resetPracticeState, stopMediaStream],
  );

  useEffect(() => {
    if (mode !== "webcam") return;

    let cancelled = false;
    let rafId = 0;

    async function initWebcamLoop() {
      try {
        setStatus("loading");
        setErrorMsg(null);

        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Peramban ini belum mendukung akses kamera secara langsung.");
        }

        const [handLandmarker, poseLandmarker, classifier, stream] = await Promise.all([
          loadHandLandmarker(),
          loadPoseLandmarker(),
          loadWordClassifier(),
          navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
            audio: false,
          }),
        ]);

        if (cancelled) {
          for (const track of stream.getTracks()) track.stop();
          return;
        }

        classifierRef.current = classifier;
        streamRef.current = stream;

        const videoEl = videoRef.current;
        if (!videoEl) return;
        videoEl.srcObject = stream;
        await videoEl.play();
        if (cancelled) return;

        lastVideoTimeRef.current = -1;
        setStatus("ready");

        const renderFrame = () => {
          if (cancelled) return;
          const video = videoRef.current;
          const canvas = canvasRef.current;

          if (video && canvas && video.readyState >= 2) {
            const vw = video.videoWidth || 640;
            const vh = video.videoHeight || 360;
            if (canvas.width !== vw || canvas.height !== vh) {
              canvas.width = vw;
              canvas.height = vh;
            }

            if (video.currentTime !== lastVideoTimeRef.current) {
              lastVideoTimeRef.current = video.currentTime;
              const nowMs = performance.now();
              const ts = Math.max(nowMs, lastVideoTsRef.current + 1);
              lastVideoTsRef.current = ts;

              const handResult = detectVideoHands(handLandmarker, video, ts);
              const poseResult = detectVideoPose(poseLandmarker, video, ts);
              const hands = handResult.landmarks ?? [];
              const poseAnchors = extractPoseAnchors(poseResult.landmarks?.[0]);

              setHandDetected(hands.length > 0);
              setPoseDetected(poseAnchors !== null);

              const ctx = canvas.getContext("2d");
              if (ctx) {
                if (showLandmarksRef.current) {
                  drawHandLandmarks(ctx, hands, canvas.width, canvas.height, true);
                  drawPoseAnchors(ctx, poseAnchors, canvas.width, canvas.height, true);
                } else {
                  ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
              }

              if (isRecordingRef.current) {
                const elapsed = nowMs - recordStartRef.current;
                const progress = Math.min(1, elapsed / RECORD_DURATION_MS);
                setRecordProgress(progress);

                if (hands.length > 0 || poseAnchors !== null) {
                  recordedFramesRef.current.push(extractWlFrameFeatures(hands, poseAnchors));
                }

                if (elapsed >= RECORD_DURATION_MS) {
                  isRecordingRef.current = false;
                  setIsRecording(false);
                  setRecordProgress(1);

                  const collected = recordedFramesRef.current;
                  if (collected.length < MIN_RECORD_FRAMES) {
                    setErrorMsg("Gerakan tangan belum cukup terekam. Coba ulangi dan pastikan tangan terlihat di kamera.");
                  } else if (classifierRef.current) {
                    setErrorMsg(null);
                    const ranked = classifierRef.current.predictFromFeatures(collected);
                    handlePredictions(ranked, WEBCAM_MATCH_THRESHOLD);
                  }
                }
              }
            }
          }

          rafId = requestAnimationFrame(renderFrame);
        };

        rafId = requestAnimationFrame(renderFrame);
      } catch (err) {
        if (cancelled) return;
        const msg =
          err instanceof Error
            ? err.message
            : "Tidak dapat mengakses kamera atau memuat model WL-BISINDO.";
        setErrorMsg(msg);
        setStatus("error");
      }
    }

    initWebcamLoop();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      stopMediaStream();
    };
  }, [mode, handlePredictions, stopMediaStream]);

  useEffect(() => {
    if (mode !== "simulation") return;

    let cancelled = false;
    let timerId = 0;

    async function runSimulationLoop() {
      try {
        setStatus("loading");
        setErrorMsg(null);
        celebratedRef.current = false;
        setMatched(false);
        setPredictions([]);

        const [classifier, sequenceMap] = await Promise.all([
          loadWordClassifier(),
          loadSimulationSequences(),
        ]);

        if (cancelled) return;
        classifierRef.current = classifier;

        const frames = sequenceMap[simSampleWord];
        if (!frames || frames.length === 0) {
          throw new Error(`Sampel simulasi untuk kata "${simSampleWord}" tidak ditemukan.`);
        }

        const parsedFrames = frames.map((frame) => {
          const hands = frame.hands.map(toLandmarkList);
          const poseAnchors = frame.pose ? toLandmarkList(frame.pose) : null;
          return {
            hands,
            poseAnchors,
            features: extractWlFrameFeatures(hands, poseAnchors),
          };
        });

        setStatus("ready");
        let idx = 0;
        let inferredOnce = false;

        const tick = () => {
          if (cancelled) return;
          const currentFrame = parsedFrames[idx];
          const canvas = canvasRef.current;

          setSimFrameIndex(idx);
          setHandDetected(currentFrame.hands.length > 0);
          setPoseDetected(currentFrame.poseAnchors !== null);

          if (canvas) {
            const ctx = canvas.getContext("2d");
            if (ctx) {
              if (showLandmarksRef.current) {
                drawHandLandmarks(ctx, currentFrame.hands, canvas.width, canvas.height, false);
                drawPoseAnchors(ctx, currentFrame.poseAnchors, canvas.width, canvas.height, false);
              } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
              }
            }
          }

          if (!inferredOnce && idx === parsedFrames.length - 1) {
            inferredOnce = true;
            const featureSequence = parsedFrames.map((item) => item.features);
            const ranked = classifier.predictFromFeatures(featureSequence);
            handlePredictions(ranked, SIM_MATCH_THRESHOLD);
          }

          idx = (idx + 1) % parsedFrames.length;
          timerId = window.setTimeout(tick, SIM_FRAME_INTERVAL_MS);
        };

        tick();
      } catch (err) {
        if (cancelled) return;
        const msg =
          err instanceof Error
            ? err.message
            : "Gagal menjalankan simulasi rangka WL-BISINDO.";
        setErrorMsg(msg);
        setStatus("error");
      }
    }

    runSimulationLoop();

    return () => {
      cancelled = true;
      window.clearTimeout(timerId);
    };
  }, [mode, simSampleWord, handlePredictions]);

  const alreadyLearned = (data.bisindo.learnedWords ?? []).includes(word.id);

  if (mode === "idle") {
    return (
      <div className="card space-y-4 bg-ink p-6 text-white">
        <div className="text-center">
          <p className="font-display text-xl font-bold">Area kamera untuk kata {word.title}</p>
          <p className="mt-1 text-sm text-white/80">
            Video diproses di perangkatmu dan tidak dikirim ke server mana pun.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => switchMode("webcam")}
            className="btn min-h-[44px] bg-sun text-ink"
          >
            Gunakan Kamera
          </button>
          <button
            type="button"
            onClick={() => switchMode("simulation")}
            className="btn min-h-[44px] bg-white text-ink"
          >
            Gunakan Video Simulasi
          </button>
        </div>

        <p className="text-center text-xs text-white/75">
          Di mode kamera, tekan Rekam Gerakan selama 2,5 detik. Di mode simulasi, aplikasi menampilkan animasi rangka tangan dan tubuh bagian atas tanpa foto wajah.
        </p>
      </div>
    );
  }

  return (
    <div className="card space-y-4 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg border-2 border-ink bg-sun px-2.5 py-1 text-xs font-bold text-ink">
            {mode === "webcam" ? "Kamera Langsung" : "Simulasi Rangka"}
          </span>
          <span className="rounded-lg border-2 border-ink bg-paper px-2.5 py-1 text-xs font-semibold text-ink">
            Tangan: {handDetected ? "Terdeteksi" : "Menunggu"}
          </span>
          <span className="rounded-lg border-2 border-ink bg-paper px-2.5 py-1 text-xs font-semibold text-ink">
            Pose: {poseDetected ? "Terdeteksi" : "Menunggu"}
          </span>
          {mode === "simulation" && status === "ready" && (
            <span className="rounded-lg border-2 border-ink bg-sky px-2.5 py-1 text-xs font-semibold text-ink">
              Frame {simFrameIndex + 1}/30
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowLandmarks((prev) => !prev)}
            className="btn min-h-[44px] bg-paper px-3 py-2 text-xs text-ink"
          >
            {showLandmarks ? "Sembunyikan Rangka" : "Tampilkan Rangka"}
          </button>
          <button
            type="button"
            onClick={() => switchMode(mode === "webcam" ? "simulation" : "webcam")}
            className="btn min-h-[44px] bg-sky px-3 py-2 text-xs text-ink"
          >
            {mode === "webcam" ? "Mode Simulasi" : "Mode Kamera"}
          </button>
          <button
            type="button"
            onClick={() => switchMode("idle")}
            className="btn min-h-[44px] bg-coral px-3 py-2 text-xs text-white"
          >
            Tutup
          </button>
        </div>
      </div>

      {mode === "simulation" && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border-2 border-ink bg-paper p-3">
          <label htmlFor="wl-sim-select" className="text-sm font-bold text-ink">
            Uji sampel gerakan:
          </label>
          <select
            id="wl-sim-select"
            value={simSampleWord}
            onChange={(e) => {
              setSimSampleWord(e.target.value);
              setSimFrameIndex(0);
            }}
            className="min-h-[44px] rounded-xl border-2 border-ink bg-white px-3 py-2 text-sm font-semibold text-ink"
          >
            {WORD_ITEMS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border-2 border-ink bg-ink">
        {mode === "webcam" && (
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className="h-full w-full -scale-x-100 object-cover"
          />
        )}
        <canvas
          ref={canvasRef}
          width={640}
          height={360}
          className="pointer-events-none absolute inset-0 h-full w-full"
        />

        {status === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/85 p-4 text-center text-white">
            <p className="font-semibold">
              {mode === "webcam"
                ? "Memuat kamera, pelacak tangan, pose, dan model kata BISINDO..."
                : "Memuat model kata BISINDO dan animasi rangka..."}
            </p>
          </div>
        )}

        {mode === "simulation" && status === "ready" && !showLandmarks && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/75 p-4 text-center text-white">
            <p className="text-sm font-semibold">
              Rangka sedang disembunyikan. Tekan Tampilkan Rangka untuk melihat animasi gerakan.
            </p>
          </div>
        )}

        {mode === "simulation" && status === "ready" && (
          <div className="pointer-events-none absolute bottom-2 left-2 right-2 flex justify-center">
            <span className="rounded-lg border border-white/25 bg-ink/80 px-3 py-1 text-xs text-white">
              Animasi rangka tangan dan bahu saja (tanpa foto wajah)
            </span>
          </div>
        )}
      </div>

      {mode === "webcam" && status === "ready" && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={startRecording}
            disabled={isRecording}
            className={`btn min-h-[44px] w-full text-center ${
              isRecording ? "bg-coral text-white opacity-95" : "bg-sun text-ink"
            }`}
          >
            {isRecording
              ? `Merekam gerakan... ${Math.round(recordProgress * 100)}%`
              : predictions.length > 0
                ? "Ulangi Rekam Gerakan (2,5 dtk)"
                : "Rekam Gerakan (2,5 dtk)"}
          </button>
          <div className="h-3 w-full overflow-hidden rounded-full border-2 border-ink bg-paper">
            <div
              className="h-full bg-mint transition-all duration-75"
              style={{ width: `${Math.round(recordProgress * 100)}%` }}
            />
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-xl border-2 border-ink bg-coral p-3 text-sm font-semibold text-white">
          {errorMsg}
        </div>
      )}

      {matched && (
        <div className="rounded-2xl border-2 border-ink bg-mint p-4 text-ink">
          <p className="font-display text-lg font-bold">
            Hebat! Gerakan kata {word.title} berhasil dikenali!
          </p>
          <p className="mt-1 text-sm font-semibold">
            {alreadyLearned
              ? `Kata ${word.title} sudah tercatat di progresmu (+15 XP).`
              : `+15 XP diraih untuk kata ${word.title}!`}
          </p>
        </div>
      )}

      {predictions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-ink/70">
            Prediksi Teratas (WL-BISINDO Conformer)
          </p>
          <div className="space-y-2">
            {predictions.map((cand) => {
              const pct = Math.round(cand.confidence * 100);
              const isTarget = cand.word === word.id;
              return (
                <div key={cand.word} className="space-y-1">
                  <div className="flex items-center justify-between text-sm font-bold text-ink">
                    <span>
                      {cand.label}
                      {isTarget ? " (Target)" : ""}
                    </span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full border-2 border-ink bg-paper">
                    <div
                      className={`h-full transition-all duration-300 ${isTarget ? "bg-mint" : "bg-sky"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
