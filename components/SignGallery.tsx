"use client";

import { useState } from "react";
import { Check, Volume2 } from "react-feather";
import { UNITS, handsOf } from "@/lib/bisindo";
import { speak } from "@/lib/audio";
import { useProgress } from "@/lib/storage/useProgress";

type Filter = "all" | number;

// Kelas ditulis literal agar ikut terbaca oleh Tailwind.
const UNIT_BG: Record<number, string> = {
  1: "bg-sun",
  2: "bg-mint",
  3: "bg-coral",
  4: "bg-sky",
};

const ALL_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function SignGallery() {
  const { data } = useProgress();
  const audio = data.settings.audioEnabled;
  const learned = data.bisindo.learnedLetters;

  const [filter, setFilter] = useState<Filter>("all");

  const unitOf = (letter: string) =>
    UNITS.find((u) => u.letters.includes(letter))?.id ?? 1;

  const letters =
    filter === "all"
      ? ALL_LETTERS
      : UNITS.find((u) => u.id === filter)?.letters ?? ALL_LETTERS;

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "Semua (A–Z)" },
    ...UNITS.map((u) => ({ id: u.id as Filter, label: u.title })),
  ];

  return (
    <div className="space-y-5">
      <div className="card bg-white p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="text-xs font-bold tracking-wider text-grape">
              LIHAT &amp; PELAJARI
            </span>
            <h3 className="mt-1 text-2xl font-bold">Alfabet Isyarat BISINDO</h3>
            <p className="mt-1 text-sm leading-relaxed text-ink/70">
              Amati bentuk tangan pada setiap gambar beserta huruf yang
              diwakilinya. Tekan tombol suara untuk mendengar nama hurufnya.
            </p>
          </div>
          <span className="rounded-full border-2 border-ink bg-mint px-3 py-1 text-xs font-bold">
            {letters.length} huruf
          </span>
        </div>

        <div
          className="mt-4 flex flex-wrap gap-2"
          role="group"
          aria-label="Filter unit alfabet"
        >
          {filters.map((f) => (
            <button
              key={String(f.id)}
              type="button"
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              className={`min-h-[44px] rounded-xl border-2 border-ink px-3.5 py-2 text-sm font-bold shadow-[3px_3px_0px_#1B1B3A] transition hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px] ${
                filter === f.id ? "bg-ink text-white" : "bg-white text-ink"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {letters.map((l) => {
          const isLearned = learned.includes(l);
          return (
            <li key={l}>
              <article
                className="card flex h-full items-center gap-4 bg-white p-4"
                aria-label={`Isyarat huruf ${l}`}
              >
                <img
                  src={`/images/bisindo/${l}.webp`}
                  alt={`Contoh pose tangan huruf BISINDO ${l}`}
                  loading="lazy"
                  className="h-28 w-28 shrink-0 rounded-2xl border-4 border-ink bg-sun/20 object-cover sm:h-32 sm:w-32"
                />

                <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
                  <span
                    className={`flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-ink font-display text-4xl font-bold ${
                      UNIT_BG[unitOf(l)]
                    }`}
                  >
                    {l}
                  </span>

                  <span className="rounded-full border-2 border-ink bg-white px-3 py-1 text-xs font-semibold">
                    {handsOf(l)} Tangan
                  </span>

                  {isLearned && (
                    <span className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-mint px-3 py-1 text-xs font-semibold">
                      <Check className="h-3 w-3" aria-hidden="true" /> Dipelajari
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => speak(l, audio)}
                    aria-label={`Dengarkan huruf ${l}`}
                    className="btn !min-h-[40px] !px-3 bg-sun"
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
