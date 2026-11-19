
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import BrailleCell from "@/components/BrailleCell";
import { KEY_TO_DOT, LETTERS, letterFrom, patternOf } from "@/lib/braille";
import { speak } from "@/lib/audio";
import { useProgress } from "@/lib/storage/useProgress";
import { BrailleMascot } from "@/components/Mascot";
import { BookOpen, PenTool, Search, Type, Volume2, type Icon } from "react-feather";
import BrailleWorks from "@/components/BrailleWorks";

const EMPTY = Array(6).fill(false) as boolean[];
const TOTAL = 5;

type Mode = "learn" | "read" | "write" | "word";

const pick = () => LETTERS[Math.floor(Math.random() * LETTERS.length)];

function shuffle<T,>(items: T[]) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function getChoices(answer: string) {
  return shuffle([
    answer,
    ...shuffle(LETTERS.filter((l) => l !== answer)).slice(0, 3),
  ]);
}

const modes: { id: Mode; icon: Icon; label: string; desc: string }[] = [
  { id: "learn", icon: BookOpen, label: "Belajar", desc: "Kenali alfabet Braille" },
  { id: "read", icon: Search, label: "Baca", desc: "Tebak pola titik" },
  { id: "write", icon: PenTool, label: "Tulis Huruf", desc: "Susun pola Braille" },
  { id: "word", icon: Type, label: "Tulis Kata", desc: "Konversi kata ke Braille" },
];

export default function BraillePage() {
  const { data, markLearned, completeBrailleQuiz } = useProgress();
  const audio = data.settings.audioEnabled;

  const [mode, setMode] = useState<Mode>("learn");
  const [dots, setDots] = useState<boolean[]>([...EMPTY]);
  const [target, setTarget] = useState("A");
  const [choices, setChoices] = useState<string[]>([]);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const [word, setWord] = useState("HUTAN");

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const locked = useRef(false);

  const letter = letterFrom(dots);
  const learned = data.braille.learnedLetters;

  const toggle = useCallback((i: number) => {
    setDots((current) =>
      current.map((v, index) => (index === i ? !v : v))
    );
  }, []);

  const clear = () => setDots([...EMPTY]);

  const startQuiz = (nextMode: "read" | "write") => {
    if (timer.current) clearTimeout(timer.current);

    const next = pick();
    locked.current = false;
    setMode(nextMode);
    setTarget(next);
    setDots(nextMode === "read" ? patternOf(next) : [...EMPTY]);
    setChoices(getChoices(next));
    setRound(1);
    setScore(0);
    setMessage("");
    setDone(false);
  };

  const answer = useCallback((value: string) => {
    if (done || locked.current || message) return;

    const correct = value === target;
    const nextScore = score + (correct ? 1 : 0);

    locked.current = true;
    setMessage(correct ? "Hebat! Jawabanmu benar ✨" : `Belum tepat. Jawabannya ${target}.`);
    if (correct) setScore(nextScore);

    speak(correct ? "Benar" : "Coba lagi", audio);

    timer.current = setTimeout(() => {
      setMessage("");

      if (round >= TOTAL) {
        setDone(true);
        completeBrailleQuiz(15);
        return;
      }

      const next = pick();
      setRound((r) => r + 1);
      setTarget(next);
      setDots(mode === "read" ? patternOf(next) : [...EMPTY]);
      setChoices(getChoices(next));
      locked.current = false;
    }, 1000);
  }, [audio, completeBrailleQuiz, done, message, mode, round, score, target]);

  const submitWrite = useCallback(() => {
    if (mode === "write") answer(letter ?? "");
  }, [answer, letter, mode]);

  const changeMode = (next: Mode) => {
    if (timer.current) clearTimeout(timer.current);
    locked.current = false;
    setMode(next);
    setDots(next === "read" ? patternOf("A") : [...EMPTY]);
    setTarget("A");
    setChoices([]);
    setRound(1);
    setScore(0);
    setMessage("");
    setDone(false);
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const el = e.target;
      if (
        el instanceof HTMLElement &&
        (["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName) || el.isContentEditable)
      ) return;

      const key = e.key.toLowerCase();

      if (mode === "read") {
        if (/^[a-z]$/.test(key) && choices.includes(key.toUpperCase())) {
          e.preventDefault();
          answer(key.toUpperCase());
        }
        return;
      }

      if (mode === "learn" || mode === "write") {
        if (mode === "write" && (done || message || locked.current)) return;

        if (key in KEY_TO_DOT) toggle(KEY_TO_DOT[key]);
        else if (e.key === "Backspace") {
          e.preventDefault();
          clear();
        } else if (
          mode === "write" &&
          (e.key === "Enter" || e.key === " ") &&
          !(el instanceof HTMLButtonElement)
        ) {
          e.preventDefault();
          submitWrite();
        }
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [answer, choices, done, message, mode, submitWrite, toggle]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const updateWord = (value: string) => {
    setWord(value.toUpperCase().replace(/[^A-Z ]/g, "").slice(0, 24));
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
 
{/* HERO */}
<section className="relative isolate overflow-hidden rounded-[2rem] border-4 border-ink bg-mint p-6 shadow-popsm sm:p-9">
  <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-grape/15" />
  <div className="pointer-events-none absolute bottom-0 right-1/3 h-24 w-24 rounded-full bg-grape/15" />

  <div className="relative z-10 grid items-center gap-5 md:grid-cols-[1fr_260px]">
    <div className="max-w-2xl">
      <span className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-white/50 px-4 py-2 text-xs font-bold tracking-wide">
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-sun" />
          SIGNIFY • AKSES BRAILLE UNTUK SEMUA
      </span>

      <h1 className="mt-5 font-display text-4xl font-bold leading-tight sm:text-6xl">
        Kenali Braille,
        <br />
        Buka Akses Dunia.
      </h1>

      <p className="mt-4 max-w-2xl leading-relaxed sm:text-lg">
        Informasi tentang hutan, pesisir, dan lingkungan harus dapat
        diakses semua orang. <br/> Yuk, belajar Braille bersama Owli!
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {["6 Titik Braille", "26 Huruf Alfabet", "Belajar Interaktif"].map((x) => (
          <span key={x} className="rounded-xl border-2 border-ink bg-white px-3 py-2 text-sm font-bold">
            {x}
          </span>
        ))}
      </div>
    </div>


    {/* MASCOT */}
    <div className="relative mx-auto w-full max-w-[230px] md:max-w-[260px]">
      {/* Glow circle */}
      <div className="absolute left-1/2 top-1/2 aspect-square w-full -translate-x-1/2 -translate-y-1/2 md:-translate-x-[67%] md:-translate-y-[40%] rounded-full bg-grape/20 blur-2xl" />

      {/* Decorative circle */}
      <div className="absolute left-1/2 top-1/2 aspect-square w-full -translate-x-1/2 -translate-y-1/2 md:-translate-x-[67%] md:-translate-y-[40%] rounded-full border-2 border-sun/50 bg-sun/50 animate-pulse" />

      {/* Mascot */}
      <div className="relative z-10 translate-x-0 md:-translate-x-10">
        <BrailleMascot activity="writing" className="animate-floaty w-full" />
      </div>
    </div>

  </div>
</section>


      {/* ENVIRONMENT CONTEXT */}
      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <article className="card bg-grape p-5 text-white sm:p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-white/75">Teknologi inklusif</p>
          <h2 className="mt-2 text-2xl font-bold">Lingkungan untuk semua.</h2>
          <p className="mt-2 text-sm leading-snug">
            Informasi mengenai pengelolaan sampah, pelestarian hutan, dan
            perlindungan pesisir perlu disampaikan dalam bentuk yang dapat
            diakses oleh berbagai kelompok masyarakat.
          </p>
        </article>
        <article className="card bg-sun p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-wider">Contoh penerapan</p>
          <h2 className="mt-2 text-2xl font-bold">Dari huruf menjadi informasi.</h2>
          <p className="mt-2 text-sm leading-snug">
            Tulisan Braille dapat digunakan pada label, petunjuk fasilitas
            publik, penanda tempat sampah, hingga informasi jalur evakuasi.
          </p>
        </article>
      </section>

      {/* MODE SELECTOR */}
      <section className="mt-9">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider">Ruang belajar</p>
            <h2 className="font-display text-3xl font-bold">Pilih aktivitasmu!</h2>
          </div>
          <span className="text-sm text-ink/70">Learning by doing</span>
        </div>

        <div className="mt-4 grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-4 gap-3" role="tablist" aria-label="Mode Braille">
          {modes.map((item) => (
            <button
              key={item.id}
              role="tab"
              aria-selected={mode === item.id}
              onClick={() => item.id === "read" || item.id === "write"
                ? startQuiz(item.id)
                : changeMode(item.id)}
              className={`btn min-h-20 text-left transition duration-200 hover:-translate-y-1 ${
                mode === item.id ? "bg-sun shadow-popsm" : "bg-white"
              }`}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <span className="text-xl sm:text-2xl shrink-0"><item.icon className="w-7 h-7 sm:w-8 sm:h-8" /></span>
                <div className="flex flex-col min-w-0">
                  <span className="block text-base sm:text-lg font-bold">{item.label}</span>
                  <span className="block text-xs font-medium leading-snug text-ink/75">{item.desc}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* LEARNING AREA */}
      <section className="mt-6 grid items-start gap-5 lg:grid-cols-[auto_1fr]">
        <div className="card flex flex-col items-center bg-paper p-5 sm:p-6">
          <h3 className="mb-4 font-bold">
            {mode === "read" ? "Pola yang harus dibaca" :
              mode === "write" ? "Susun pola titik" :
              mode === "word" ? "Pratinjau Braille" : "Simulator Braille"}
          </h3>

          {mode === "word" ? (
            <div className="text-center">
              <p className="text-sm">Ketik kata untuk melihat pola Braille.</p>
              <input
                value={word}
                onChange={(e) => updateWord(e.target.value)}
                maxLength={24}
                placeholder="Contoh: HUTAN"
                aria-label="Ketik kata yang ingin dikonversi"
                className="mt-3 w-full rounded-xl border-2 border-ink bg-white px-4 py-3 text-center text-xl font-bold uppercase outline-none focus:ring-4 focus:ring-grape/30"
              />
              <p className="mt-2 text-xs text-ink/60">Maksimal 24 karakter, huruf A–Z.</p>
            </div>
          ) : (
            <BrailleCell
              dots={dots}
              onToggle={toggle}
              disabled={mode === "read" || done || Boolean(message)}
            />
          )}

          {mode !== "read" && mode !== "word" && (
            <button onClick={clear} className="btn mt-4 w-full bg-white" disabled={done || Boolean(message)}>
              Kosongkan titik
            </button>
          )}

          {mode === "word" && (
            <div className="mt-4 rounded-xl border-2 border-ink bg-mint p-3 text-sm font-bold">
              {word.replace(/ /g, " · ") || "Ketik kata terlebih dahulu"}
            </div>
          )}

          {mode !== "word" && (
            <p className="mt-4 max-w-xs text-center text-xs leading-relaxed">
              {mode === "read"
                ? "Amati titik aktif, lalu pilih huruf yang sesuai."
                : "Klik titik atau gunakan tombol F-D-S dan J-K-L."}
            </p>
          )}
        </div>

        <div className="min-w-0 space-y-4">
          {mode === "learn" && (
            <>
              <div className="card bg-grape p-5 text-white" aria-live="polite">
                <p className="text-sm">Huruf yang terbentuk</p>
                <p className="font-display text-6xl font-bold">{letter ?? "?"}</p>
                <p className="mt-2 text-sm">
                  {letter ? `Pola titik ini membentuk huruf ${letter}.` :
                    "Kombinasi titik belum memetakan huruf alfabet A–Z."}
                </p>
                {letter && (
                  <button
                    onClick={() => {
                      markLearned("braille", letter);
                      speak(letter, audio);
                    }}
                    className="btn mt-3 bg-sun text-ink"
                  >
                    {learned.includes(letter) ? "Sudah dipelajari ✓" : "Tandai dipelajari"}
                  </button>
                )}
              </div>

              <div className="card bg-white p-4 sm:p-5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-base sm:text-lg">Alfabet Braille A–Z</h3>
                  <span className="rounded-full bg-mint px-2.5 py-0.5 sm:px-3 sm:py-1 text-xs font-bold">
                    {learned.length}/26 dipelajari
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-6 gap-1.5 sm:grid-cols-9 sm:gap-2">
                  {LETTERS.map((l) => (
                    <button
                      key={l}
                      onClick={() => {
                        setDots(patternOf(l));
                        speak(l, audio);
                      }}
                      aria-label={`Pilih huruf ${l}`}
                      className={`h-10 sm:h-11 rounded-xl border-2 border-ink font-display text-base sm:text-lg font-bold transition hover:-translate-y-1 ${
                        letter === l ? "bg-ink text-white" :
                          learned.includes(l) ? "bg-mint" : "bg-white"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {(mode === "read" || mode === "write") && (
            <div className="card bg-sun p-5" aria-live="polite">
              {done ? (
                <>
                  <h3 className="text-2xl font-bold">Sesi selesai! 🎉</h3>
                  <p className="mt-2">Skor kamu: {score}/{TOTAL}</p>
                  <p className="text-sm">+15 XP berhasil ditambahkan.</p>
                  <button onClick={() => startQuiz(mode)} className="btn mt-4 bg-white">
                    Main lagi
                  </button>
                </>
              ) : (
                <>
                  <div className="flex justify-between text-sm font-bold">
                    <span>Soal {round}/{TOTAL}</span>
                    <span>Skor: {score}</span>
                  </div>
                  {mode === "read" ? (
                    <>
                      <h3 className="mt-4 text-3xl font-bold">Huruf apakah ini?</h3>
                      <p className="mt-1 text-sm">Pilih jawaban yang benar.</p>
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        {choices.map((c) => (
                          <button
                            key={c}
                            disabled={Boolean(message)}
                            onClick={() => answer(c)}
                            className="btn bg-white font-display text-2xl disabled:opacity-60"
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="mt-4 text-sm font-semibold">Susun pola Braille untuk huruf:</p>
                      <h3 className="font-display text-6xl font-bold">{target}</h3>
                      <button onClick={submitWrite} disabled={Boolean(message)} className="btn mt-3 bg-white disabled:opacity-60">
                        Periksa jawaban
                      </button>
                    </>
                  )}
                  <p className="mt-4 min-h-6 text-sm font-bold" aria-live="polite">{message}</p>
                  <p className="mt-2 text-xs">
                    {mode === "read"
                      ? "Kamu juga bisa mengetik huruf jawaban melalui keyboard."
                      : "Gunakan F-D-S / J-K-L. Backspace untuk menghapus, Enter atau Space untuk memeriksa."}
                  </p>
                </>
              )}
            </div>
          )}

          {mode === "word" && (
            <div className="card bg-grape p-5 text-white">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xl font-bold">Hasil konversi Braille</h3>
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs">
                  {word.replace(/ /g, "").length} huruf
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                {word.split("").map((char, index) => (
                  char === " " ? (
                    <div key={index} className="flex w-5 items-center justify-center text-xl opacity-60">·</div>
                  ) : (
                    <div key={index} className="rounded-xl border-2 border-white/40 bg-white/10 p-2 text-center transition duration-200 hover:scale-105">
                      <p className="mb-2 font-bold">{char}</p>
                      <div className="grid grid-cols-2 gap-1">
                        {([0, 3, 1, 4, 2, 5]).map((dot) => (
                          <span
                            key={dot}
                            className={`h-3.5 w-3.5 rounded-full border border-white/60 ${
                              patternOf(char)[dot] ? "bg-sun" : "bg-white/15"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )
                ))}
              </div>
              <p className="mt-4 text-xs leading-relaxed text-white/80">
                Setiap kartu menunjukkan satu huruf dan kombinasi enam titiknya.
                Spasi memisahkan kata. Fitur ini mendukung alfabet A–Z.
              </p>
              <button onClick={() => speak(word, audio)} className="btn mt-4 bg-sun text-ink">
                <Volume2 className="w-5 h-5" /> Dengarkan kata
              </button>
            </div>
          )}
        </div>
      </section>

      {/* BRAILLE WORKS */}
      <section className="mt-6">
        <BrailleWorks />
      </section>

      {/* CLOSING */}
      <section className="mt-6 rounded-[2rem] border-4 border-ink bg-mint p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-wider">Akses untuk semua</p>
        <h2 className="mt-2 max-w-2xl font-display text-2xl font-bold sm:text-3xl">
          Lingkungan yang lestari juga harus inklusif.
        </h2>
        <p className="mt-2 text-sm leading-snug">
          Pelestarian hutan dan pesisir membutuhkan partisipasi seluruh
          masyarakat. Akses informasi yang inklusif merupakan salah satu
          langkah agar setiap orang dapat ikut memahami dan menjaga lingkungan.
        </p>
      </section>
    </main>
  );
}
