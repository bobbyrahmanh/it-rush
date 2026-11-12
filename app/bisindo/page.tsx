"use client";
import { useState } from "react";
import CameraSlot from "@/components/CameraSlot";
import Reveal from "@/components/Reveal";
import { UNITS, handsOf } from "@/lib/bisindo";
import { speak } from "@/lib/audio";
import { useProgress } from "@/lib/storage/useProgress";

export default function BisindoPage() {
  const [sel, setSel] = useState("A");
  const { data } = useProgress();
  const learned = data.bisindo.learnedLetters;
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
        </div>

        <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div key={sel} className="card animate-pop flex items-center gap-5 bg-white p-5">
            <span className="flex h-24 w-24 items-center justify-center rounded-3xl border-4 border-ink bg-grape font-display text-6xl font-bold text-white">{sel}</span>
            <div>
              <span className="inline-block rounded-full border-2 border-ink bg-mint px-3 py-1 font-semibold">{handsOf(sel)} Tangan</span>
              <button onClick={() => speak(sel, data.settings.audioEnabled)} className="btn ml-2 !min-h-[44px] !px-4 bg-sun" aria-label={`Dengarkan huruf ${sel}`}><span aria-hidden="true">🔊</span></button>
              {sel === "J" && <p className="mt-2 text-sm">Catatan praktik: sehari-hari huruf J digerakkan melengkung di udara. Untuk latihan kamera, tahan pose akhir kelingking mengarah ke samping.</p>}
            </div>
          </div>
          <CameraSlot letter={sel} />
        </div>
      </div>
    </div>
  );
}
