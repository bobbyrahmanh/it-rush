"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Award, Check, RotateCcw, Volume2, X } from "react-feather";
import { handsOf } from "@/lib/bisindo";
import { speak } from "@/lib/audio";
import { useProgress } from "@/lib/storage/useProgress";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const TOTAL = 10; // 10 soal per ronde (FR-BIS-05)
const XP_REWARD = 20; // +20 XP saat ronde tuntas
const FEEDBACK_MS = 1400;

interface Question {
  answer: string;
  choices: string[];
}

function shuffle<T>(items: T[]) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// 10 huruf unik per ronde, masing-masing dengan 4 pilihan (1 benar + 3 pengecoh).
function buildRound(): Question[] {
  return shuffle(ALPHABET)
    .slice(0, TOTAL)
    .map((answer) => ({
      answer,
      choices: shuffle([
        answer,
        ...shuffle(ALPHABET.filter((l) => l !== answer)).slice(0, 3),
      ]),
    }));
}

export default function GuessTheSign() {
  const { data, completeGuessTheSign } = useProgress();
  const audio = data.settings.audioEnabled;
  const bestScore = data.bisindo.guessTheSignBestScore ?? 0;

  // Soal diacak di sisi klien (setelah mount) agar tidak terjadi hydration mismatch.
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [newBest, setNewBest] = useState(false);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startRound = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setQuestions(buildRound());
    setIndex(0);
    setScore(0);
    setPicked(null);
    setDone(false);
    setNewBest(false);
  }, []);

  useEffect(() => {
    startRound();
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [startRound]);

  const current = questions[index];

  const answer = useCallback(
    (value: string) => {
      if (!current || picked || done) return;

      const correct = value === current.answer;
      const finalScore = score + (correct ? 1 : 0);

      setPicked(value);
      if (correct) setScore(finalScore);
      speak(correct ? "Benar" : "Coba lagi", audio);

      timer.current = setTimeout(() => {
        if (index + 1 >= TOTAL) {
          const percent = Math.round((finalScore / TOTAL) * 100);
          setNewBest(percent > bestScore);
          completeGuessTheSign(finalScore, TOTAL, XP_REWARD);
          setDone(true);
          setPicked(null);
          return;
        }
        setIndex((i) => i + 1);
        setPicked(null);
      }, FEEDBACK_MS);
    },
    [audio, bestScore, completeGuessTheSign, current, done, index, picked, score]
  );

  // Pintasan keyboard: ketik huruf jawaban, atau tombol 1-4 untuk memilih opsi.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target;
      if (
        el instanceof HTMLElement &&
        (["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName) || el.isContentEditable)
      )
        return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (!current || picked || done) return;

      if (/^[1-4]$/.test(e.key)) {
        e.preventDefault();
        answer(current.choices[Number(e.key) - 1]);
        return;
      }

      const key = e.key.toUpperCase();
      if (/^[A-Z]$/.test(key) && current.choices.includes(key)) {
        e.preventDefault();
        answer(key);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answer, current, done, picked]);

  const progressPercent = Math.round(((done ? TOTAL : index) / TOTAL) * 100);

  if (!current && !done) {
    return (
      <div className="card bg-sun p-6 text-center font-bold" aria-busy="true">
        Menyiapkan soal…
      </div>
    );
  }

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[1fr_1fr]">
      {/* KIRI: GAMBAR ISYARAT */}
      <div className="card flex flex-col items-center bg-paper p-5 sm:p-6">
        <h3 className="mb-4 font-bold">
          {done ? "Ronde selesai" : "Isyarat tangan BISINDO"}
        </h3>

        {done ? (
          <div className="flex aspect-square w-full max-w-sm flex-col items-center justify-center rounded-2xl border-4 border-ink bg-white p-6 text-center">
            <Award className="h-16 w-16 text-grape" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold">Skor akhirmu</p>
            <p className="font-display text-6xl font-bold">
              {score}/{TOTAL}
            </p>
          </div>
        ) : (
          <div className="relative w-full max-w-sm">
            <img
              key={current.answer}
              src={`/images/bisindo/${current.answer}.webp`}
              alt="Isyarat tangan BISINDO yang harus ditebak"
              className="animate-pop aspect-square w-full rounded-2xl border-4 border-ink bg-sun/20 object-cover"
            />
            {picked && (
              <span
                className={`absolute right-3 top-3 flex h-12 w-12 items-center justify-center rounded-full border-4 border-ink ${
                  picked === current.answer ? "bg-mint" : "bg-coral text-white"
                }`}
                aria-hidden="true"
              >
                {picked === current.answer ? (
                  <Check className="h-6 w-6" />
                ) : (
                  <X className="h-6 w-6" />
                )}
              </span>
            )}
          </div>
        )}

        {!done && (
          <p className="mt-4 max-w-xs text-center text-xs leading-relaxed">
            Amati bentuk tangan pada gambar, lalu pilih huruf yang sesuai.
          </p>
        )}
      </div>

      {/* KANAN: PERTANYAAN & PILIHAN */}
      <div className="card bg-sun p-5" aria-live="polite">
        {done ? (
          <>
            <h3 className="text-2xl font-bold">Ronde selesai! 🎉</h3>
            <p className="mt-2">
              Kamu menjawab benar {score} dari {TOTAL} soal.
            </p>
            {newBest && (
              <p className="mt-2 inline-block rounded-full border-2 border-ink bg-mint px-3 py-1 text-sm font-bold">
                Skor terbaik baru!
              </p>
            )}
            <p className="mt-2 text-sm">+{XP_REWARD} XP berhasil ditambahkan.</p>
            <p className="text-sm">
              Skor terbaik: {Math.max(bestScore, Math.round((score / TOTAL) * 100))}%
            </p>
            <button onClick={startRound} className="btn mt-4 bg-white">
              <RotateCcw className="h-5 w-5" /> Main lagi
            </button>
          </>
        ) : (
          <>
            <div className="flex flex-wrap justify-between gap-2 text-sm font-bold">
              <span>
                Soal {index + 1}/{TOTAL}
              </span>
              <span>Skor: {score}</span>
              <span>Terbaik: {bestScore}%</span>
            </div>

            <div
              className="mt-3 h-3 overflow-hidden rounded-full border-2 border-ink bg-white"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progressPercent}
              aria-label="Progres ronde"
            >
              <div
                className="h-full rounded-full bg-grape transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <h3 className="mt-5 text-3xl font-bold">Huruf apakah ini?</h3>
            <p className="mt-1 text-sm">
              Isyarat ini memakai {handsOf(current.answer)} tangan.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {current.choices.map((c, i) => {
                const isAnswer = c === current.answer;
                const isPicked = picked === c;
                let state = "bg-white";
                if (picked) {
                  if (isAnswer) state = "bg-mint";
                  else if (isPicked) state = "bg-coral text-white";
                }
                return (
                  <button
                    key={c}
                    type="button"
                    disabled={Boolean(picked)}
                    onClick={() => answer(c)}
                    aria-label={`Pilihan ${i + 1}: huruf ${c}`}
                    className={`btn font-display text-3xl hover:-translate-y-1 disabled:opacity-100 ${state}`}
                  >
                    {c}
                    {picked && isAnswer && <Check className="h-5 w-5" aria-hidden="true" />}
                    {picked && isPicked && !isAnswer && <X className="h-5 w-5" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>

            <p className="mt-4 min-h-6 text-sm font-bold">
              {picked
                ? picked === current.answer
                  ? "Hebat! Jawabanmu benar ✨"
                  : `Belum tepat. Jawabannya ${current.answer}.`
                : ""}
            </p>

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs">
                Kamu juga bisa menekan huruf atau tombol 1–4 di keyboard.
              </p>
              {picked && (
                <button
                  type="button"
                  onClick={() => speak(current.answer, audio)}
                  aria-label={`Dengarkan huruf ${current.answer}`}
                  className="btn !min-h-[36px] !px-3 bg-white"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
