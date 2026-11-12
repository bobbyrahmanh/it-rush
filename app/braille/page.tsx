"use client";
import { useCallback, useEffect, useState } from "react";
import BrailleCell from "@/components/BrailleCell";
import { KEY_TO_DOT, LETTERS, letterFrom, patternOf } from "@/lib/braille";
import { speak } from "@/lib/audio";
import { useProgress } from "@/lib/storage/useProgress";

const EMPTY = Array(6).fill(false) as boolean[];
const pick = () => LETTERS[Math.floor(Math.random() * 26)];

export default function BraillePage() {
  const { data, markLearned, completeBrailleQuiz } = useProgress();
  const audio = data.settings.audioEnabled;
  const [mode, setMode] = useState<"learn" | "quiz">("learn");
  const [dots, setDots] = useState<boolean[]>(EMPTY);
  const [target, setTarget] = useState("A");
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [msg, setMsg] = useState("");
  const [done, setDone] = useState(false);
  const letter = letterFrom(dots);
  const toggle = useCallback((i: number) => setDots((d) => d.map((v, k) => (k === i ? !v : v))), []);

  const submit = useCallback(() => {
    const ok = letterFrom(dots) === target;
    setMsg(ok ? "Tepat sekali!" : `Belum tepat. Pola untuk ${target} ada di daftar huruf.`);
    if (ok) setScore((s) => s + 1);
    speak(ok ? "Benar" : "Coba lagi", audio);
    setTimeout(() => {
      setMsg(""); setDots(EMPTY);
      if (round >= 5) { setDone(true); completeBrailleQuiz(15); } else { setRound((r) => r + 1); setTarget(pick()); }
    }, 1100);
  }, [dots, target, round, audio, completeBrailleQuiz]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && ["INPUT", "TEXTAREA", "BUTTON"].includes(e.target.tagName) && e.key === " ") return;
      const k = e.key.toLowerCase();
      if (k in KEY_TO_DOT) toggle(KEY_TO_DOT[k]);
      else if (e.key === "Backspace") setDots(EMPTY);
      else if ((e.key === " " || e.key === "Enter") && mode === "quiz" && !done && !msg) { e.preventDefault(); submit(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [toggle, mode, submit, done, msg]);

  const startQuiz = () => { setMode("quiz"); setDots(EMPTY); setTarget(pick()); setRound(1); setScore(0); setDone(false); };
  const choose = (l: string) => { setDots(patternOf(l)); speak(l, audio); };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-4xl font-bold sm:text-5xl">Belajar Braille</h1>
      <div className="mt-5 flex flex-wrap gap-3" role="tablist" aria-label="Mode Braille">
        <button role="tab" aria-selected={mode === "learn"} onClick={() => { setMode("learn"); setDots(EMPTY); }} className={`btn ${mode === "learn" ? "bg-sun" : "bg-white"}`}>Belajar dan simulator</button>
        <button role="tab" aria-selected={mode === "quiz"} onClick={startQuiz} className={`btn ${mode === "quiz" ? "bg-sun" : "bg-white"}`}>Quiz susun titik</button>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[auto_1fr]">
        <div className="space-y-4">
          <BrailleCell dots={dots} onToggle={toggle} />
          <p className="max-w-xs text-sm">Klik lingkaran atau tekan F-D-S dan J-K-L untuk menyalakan atau mematikan titik. Tekan Backspace untuk mengosongkan.</p>
          <button onClick={() => setDots(EMPTY)} className="btn bg-white">Kosongkan</button>
        </div>

        <div className="space-y-5">
          {mode === "learn" ? (
            <>
              <div className="card animate-pop bg-grape p-6 text-white" aria-live="polite">
                <p className="text-lg">Huruf yang terbentuk:</p>
                <p className="font-display text-7xl font-bold">{letter ?? "?"}</p>
                {!letter && <p>Kombinasi titik belum memetakan huruf alfabet A sampai Z.</p>}
                {letter && <button onClick={() => { markLearned("braille", letter); speak(letter, audio); }} className="btn mt-3 bg-sun text-ink">{data.braille.learnedLetters.includes(letter) ? "Sudah dipelajari ✓" : "Tandai sudah dipelajari"}</button>}
              </div>
              <ul className="grid grid-cols-6 gap-2 sm:grid-cols-9" aria-label="Daftar huruf A sampai Z">
                {LETTERS.map((l) => (
                  <li key={l}><button onClick={() => choose(l)} className={`h-12 w-full min-w-[44px] rounded-xl border-4 border-ink font-display text-xl font-bold transition hover:-translate-y-1 ${letter === l ? "bg-ink text-white" : data.braille.learnedLetters.includes(l) ? "bg-mint" : "bg-white"}`}>{l}</button></li>
                ))}
              </ul>
            </>
          ) : (
            <div className="card bg-sun p-6" aria-live="polite">
              {done ? (
                <>
                  <h2 className="text-3xl font-bold">Selesai! Skor {score} dari 5</h2>
                  <p className="mt-2">+15 XP tersimpan.</p>
                  <button onClick={startQuiz} className="btn mt-4 bg-white">Main lagi</button>
                </>
              ) : (
                <>
                  <p className="font-semibold">Soal {round} dari 5</p>
                  <h2 className="text-4xl font-bold">Susun huruf {target}</h2>
                  <p className="mt-2 min-h-[1.5rem] font-semibold">{msg}</p>
                  <button onClick={submit} className="btn mt-3 bg-white">Periksa jawaban</button>
                  <p className="mt-2 text-sm">Atau tekan Space atau Enter.</p>
                </>
              )}
            </div>
          )}

          <aside className="card bg-sky p-6">
            <h2 className="text-2xl font-bold">Tahukah kamu? Begini cara teman Tunanetra mengetik dengan cepat</h2>
            <p className="mt-2 leading-relaxed">Pada mesin tik <strong>Perkins Brailler</strong> dan fitur <strong>Braille Screen Input</strong> di ponsel, enam jari diletakkan pada enam tombol titik. Di simulator ini: tangan kiri telunjuk di <strong>F</strong> (titik 1), tengah di <strong>D</strong> (titik 2), manis di <strong>S</strong> (titik 3). Tangan kanan telunjuk di <strong>J</strong> (titik 4), tengah di <strong>K</strong> (titik 5), manis di <strong>L</strong> (titik 6). Telunjuk memegang titik teratas karena jari itu paling kuat dan lincah.</p>
            <p className="mt-3 leading-relaxed"><strong>Tips menghafal:</strong> huruf A sampai J memakai titik 1, 2, 4, 5. K sampai T sama dengan A sampai J ditambah titik 3. U, V, X, Y, Z menambah titik 3 dan 6, kecuali W yang unik karena belum ada di abjad Prancis saat Braille diciptakan.</p>
          </aside>
        </div>
      </div>
    </div>
  );
}
