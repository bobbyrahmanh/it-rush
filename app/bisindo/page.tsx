"use client";
import { useState } from "react";
import CameraSlot from "@/components/CameraSlot";
import WordCameraSlot from "@/components/WordCameraSlot";
import Reveal from "@/components/Reveal";
import { UNITS, WORD_ITEMS, handsOf } from "@/lib/bisindo";
import { speak } from "@/lib/audio";
import { useProgress } from "@/lib/storage/useProgress";

export default function BisindoPage() {
  const [selState, setSelState] = useState<
    { kind: "letter"; value: string } | { kind: "word"; value: string }
  >({ kind: "letter", value: "A" });
  const sel = selState.kind === "letter" ? selState.value : "";
  const setSel = (value: string) => setSelState({ kind: "letter", value });
  const { data } = useProgress();
  const learned = data.bisindo.learnedLetters;
  const learnedWords = data.bisindo.learnedWords ?? [];
  const selectedWord =
    selState.kind === "word"
      ? WORD_ITEMS.find((w) => w.id === selState.value) ?? WORD_ITEMS[0]
      : null;
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-4xl font-bold sm:text-5xl">Belajar BISINDO</h1>
      <p className="mt-2 text-lg">Semua huruf terbuka sejak awal. Ikuti urutan unit jika kamu pemula.</p>

      <Reveal>
        <aside className="card mt-6 bg-sun p-6">
          <h2 className="text-2xl font-bold">Tahukah kamu? Mengapa banyak huruf BISINDO memakai dua tangan?</h2>
          <p className="mt-2 leading-relaxed">BISINDO tumbuh alami dari komunitas Tuli di Indonesia. Pada alfabetnya, <strong>16 huruf dibentuk dengan dua tangan</strong> agar menyerupai bentuk huruf Latin, sedangkan <strong>10 huruf lain memakai satu tangan</strong> (C, E, I, J, L, O, R, U, V, Z).</p>
        </aside>
      </Reveal>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-5">
          {UNITS.map((u) => (
            <Reveal key={u.id}>
              <section className={`card p-5 ${u.color}`} aria-labelledby={`u${u.id}`}>
                <h2 id={`u${u.id}`} className="text-xl font-bold">{u.title}</h2>
                <ul className="mt-3 flex flex-wrap gap-3">
                  {u.letters.map((l) => (
                    <li key={l}>
                      <button onClick={() => { setSel(l); speak(l, data.settings.audioEnabled); }} aria-pressed={sel === l} aria-label={`Huruf ${l}, ${handsOf(l)} tangan${learned.includes(l) ? ", sudah dipelajari" : ""}`}
                        className={`relative flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-ink font-display text-2xl font-bold transition hover:-translate-y-1 ${sel === l ? "bg-ink text-white" : "bg-white"}`}>
                        {l}
                        {learned.includes(l) && <span aria-hidden="true" className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-ink bg-mint text-sm">✓</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            </Reveal>
          ))}
          <section className="card space-y-3 bg-grape p-5 text-white">
            <div className="space-y-1">
              <h2 className="font-display text-xl font-bold">Unit 5: Kata Dasar Dinamis ({WORD_ITEMS.length} Kata)</h2>
              <p className="text-sm text-white/90">
                Isyarat kata bergerak menggunakan pelacakan 2 tangan dan posisi bahu secara real-time.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {WORD_ITEMS.map((w) => {
                const active = selState.kind === "word" && selState.value === w.id;
                const isDone = learnedWords.includes(w.id);
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setSelState({ kind: "word", value: w.id })}
                    className={`min-h-[44px] rounded-xl border-2 border-ink px-3.5 py-2 text-sm font-bold shadow-[3px_3px_0px_#1B1B3A] transition active:translate-x-[1px] active:translate-y-[1px] ${
                      active ? "bg-ink text-white" : isDone ? "bg-mint text-ink" : "bg-white text-ink"
                    }`}
                  >
                    {w.title}
                    {isDone ? " ✓" : ""}
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          {selectedWord ? (
            <>
              <div key={selectedWord.id} className="card animate-pop space-y-3 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-2xl border-2 border-ink bg-grape px-4 py-2 font-display text-2xl font-bold text-white shadow-[3px_3px_0px_#1B1B3A]">
                      {selectedWord.title}
                    </span>
                    <span className="rounded-full border-2 border-ink bg-mint px-3 py-1 text-sm font-bold text-ink">
                      {selectedWord.hands} Tangan
                    </span>
                    {learnedWords.includes(selectedWord.id) && (
                      <span className="rounded-full border-2 border-ink bg-sun px-3 py-1 text-sm font-bold text-ink">
                        Dikuasai ✓
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    aria-label={`Dengarkan kata ${selectedWord.title}`}
                    onClick={() => speak(selectedWord.title, data.settings.audioEnabled)}
                    className="btn min-h-[44px] min-w-[44px] bg-sun px-3 py-2 text-ink"
                  >
                    🔊
                  </button>
                </div>
                <p className="text-sm font-medium text-ink">{selectedWord.guide}</p>
              </div>
              <WordCameraSlot word={selectedWord} />
            </>
          ) : (
            <>
          <div key={sel} className="card animate-pop flex flex-wrap items-center gap-4 bg-white p-5 sm:flex-nowrap">
            <img
              src={`/images/bisindo/${sel}.webp`}
              alt={`Contoh pose tangan huruf BISINDO ${sel}`}
              className="h-28 w-28 shrink-0 rounded-2xl border-4 border-ink bg-sun/20 object-cover sm:h-32 sm:w-32"
            />
            <div className="flex items-start gap-4">
              <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl border-4 border-ink bg-grape font-display text-5xl font-bold text-white">{sel}</span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-block rounded-full border-2 border-ink bg-mint px-3 py-1 font-semibold">{handsOf(sel)} Tangan</span>
                  <button onClick={() => speak(sel, data.settings.audioEnabled)} className="btn !min-h-[44px] !px-4 bg-sun" aria-label={`Dengarkan huruf ${sel}`}><span aria-hidden="true">🔊</span></button>
                </div>
                <p className="mt-2 text-sm text-ink/80">Tirukan bentuk tangan pada foto contoh, lalu tahan selama 1,5 detik di kamera.</p>
                {sel === "J" && <p className="mt-1 text-sm">Catatan praktik: sehari-hari huruf J digerakkan melengkung di udara. Untuk latihan kamera, tahan pose akhir kelingking mengarah ke samping.</p>}
              </div>
            </div>
          </div>
          <CameraSlot letter={sel} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
