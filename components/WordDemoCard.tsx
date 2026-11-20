"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Pause, Play, RefreshCw, Volume2 } from "react-feather";
import type { WordItem } from "@/lib/bisindo";
import type { WordDemoRow } from "@/lib/supabase/client";

interface WordDemoCardProps {
  word: WordItem;
  isLearned: boolean;
  demo?: WordDemoRow;
  isLoadingDemo: boolean;
  onSpeak: () => void;
}

function isImageAnimation(demo: WordDemoRow): boolean {
  const mime = demo.mime_type.toLowerCase();
  const url = demo.video_url.toLowerCase();
  return mime.startsWith("image/") || url.endsWith(".webp") || url.endsWith(".gif");
}

export default function WordDemoCard({
  word,
  isLearned,
  demo,
  isLoadingDemo,
  onSpeak,
}: WordDemoCardProps) {
  const [mediaFailed, setMediaFailed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    setMediaFailed(false);
    setRetryCount(0);
    setIsPlaying(true);
  }, [word.id, demo?.video_url]);

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const isImgAnim = demo ? isImageAnimation(demo) : false;

  const mediaUrl = demo?.video_url
    ? retryCount > 0
      ? `${demo.video_url}${demo.video_url.includes("?") ? "&" : "?"}retry=${retryCount}`
      : demo.video_url
    : null;

  return (
    <div
      key={word.id}
      className="card animate-pop space-y-3 bg-white p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-2xl border-2 border-ink bg-grape px-3 py-1.5 font-display text-xl font-bold text-white shadow-[3px_3px_0px_#1B1B3A]">
            {word.title}
          </span>
          <span className="rounded-full border-2 border-ink bg-mint px-3 py-1 text-sm font-bold text-ink">
            {word.hands} Tangan
          </span>
          {isLearned && (
            <span className="rounded-full border-2 border-ink bg-sun px-3 py-1 text-sm font-bold text-ink">
              Dikuasai <Check className="inline h-3 w-3" />
            </span>
          )}
        </div>

        <button
          type="button"
          aria-label={`Dengarkan kata ${word.title}`}
          onClick={onSpeak}
          className="btn !min-h-[44px] min-w-[44px] bg-sun !px-3 py-2 text-ink"
        >
          <Volume2 className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-ink">
            Ikuti gerakan seperti ini:
          </p>
          {mediaUrl && !mediaFailed && !isImgAnim && (
            <button
              type="button"
              onClick={togglePlayback}
              aria-pressed={!isPlaying}
              aria-label={isPlaying ? `Hentikan animasi ${word.title}` : `Putar animasi ${word.title}`}
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-sky px-3 py-1 text-xs font-bold text-ink transition hover:bg-sun"
            >
              {isPlaying ? (
                <>
                  <Pause className="h-3.5 w-3.5" />
                  Stop
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" />
                  Putar
                </>
              )}
            </button>
          )}
        </div>

        {isLoadingDemo ? (
          <div
            className="flex h-44 w-full animate-pulse items-center justify-center rounded-2xl border-2 border-ink bg-surface-secondary text-xs font-semibold text-ink/65 sm:h-48 lg:h-[clamp(10rem,24vh,14rem)]"
            role="status"
            aria-live="polite"
          >
            Memuat contoh gerakan {word.title}...
          </div>
        ) : mediaUrl && !mediaFailed ? (
          <div className="relative overflow-hidden rounded-2xl border-2 border-ink bg-ink">
            {isImgAnim ? (
              <img
                key={mediaUrl}
                src={mediaUrl}
                alt={`Animasi contoh gerakan BISINDO kata ${word.title}`}
                onError={() => setMediaFailed(true)}
                className="h-44 w-full object-contain sm:h-48 lg:h-[clamp(10rem,24vh,14rem)]"
              />
            ) : (
              <video
                ref={videoRef}
                key={mediaUrl}
                src={mediaUrl}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                onClick={togglePlayback}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                aria-label={`Video berulang contoh gerakan BISINDO kata ${word.title}`}
                onError={() => setMediaFailed(true)}
                className="h-44 w-full cursor-pointer object-contain sm:h-48 lg:h-[clamp(10rem,24vh,14rem)]"
              />
            )}
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-ink/30 bg-surface-secondary p-3.5 text-xs leading-relaxed text-ink/75">
            <p className="font-semibold text-ink">
              {mediaFailed
                ? `Gagal memuat animasi contoh untuk kata ${word.title}.`
                : `Animasi contoh kata ${word.title} belum tersedia di Supabase Storage.`}
            </p>
            <p className="mt-1">{word.guide}</p>
            {mediaFailed && (
              <button
                type="button"
                onClick={() => {
                  setMediaFailed(false);
                  setRetryCount((prev) => prev + 1);
                }}
                className="mt-2 inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-white px-3 py-1 text-xs font-bold text-ink transition hover:bg-sun"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Muat ulang video
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
