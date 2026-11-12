"use client";
import Link from "next/link";
import { useState } from "react";
import Mascot from "@/components/Mascot";
import { LETTERS } from "@/lib/braille";
import { useProgress } from "@/lib/storage/useProgress";

function Grid({ title, learned }: { title: string; learned: string[] }) {
  return (
    <section className="card bg-white p-6">
      <h2 className="text-2xl font-bold">{title} ({learned.length}/26)</h2>
      <ul className="mt-4 grid grid-cols-7 gap-2 sm:grid-cols-9 lg:grid-cols-13" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(44px, 1fr))" }}>
        {LETTERS.map((l) => (
          <li key={l} className={`flex h-11 items-center justify-center rounded-xl border-4 border-ink font-display font-bold ${learned.includes(l) ? "bg-mint" : "bg-paper text-ink/70"}`}>{l}</li>
        ))}
      </ul>
    </section>
  );
}

export default function ProgressPage() {
  const { data, reset } = useProgress();
  const [confirm, setConfirm] = useState(false);
  const level = Math.floor(data.xp / 100) + 1;
  const empty = data.xp === 0;
  const stats = [
    { l: "Streak harian", v: `${data.streak.current} hari`, c: "bg-coral" },
    { l: "Total XP", v: `${data.xp}`, c: "bg-sun" },
    { l: "Level", v: `${level}`, c: "bg-grape text-white" },
  ];
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10">
      <h1 className="text-4xl font-bold sm:text-5xl">Progres saya</h1>
      {empty && (
        <div className="card flex flex-col items-center gap-3 bg-sky p-6 text-center sm:flex-row sm:text-left">
          <Mascot className="h-32 w-32 shrink-0" />
          <div>
            <p className="text-xl font-semibold">Belum ada progres. Yuk mulai dari satu huruf!</p>
            <div className="mt-3 flex flex-wrap gap-3"><Link href="/bisindo" className="btn bg-sun">Belajar BISINDO</Link><Link href="/braille" className="btn bg-white">Belajar Braille</Link></div>
          </div>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => <div key={s.l} className={`card p-5 ${s.c}`}><p className="font-semibold">{s.l}</p><p className="font-display text-4xl font-bold">{s.v}</p></div>)}
      </div>
      <Grid title="Huruf BISINDO" learned={data.bisindo.learnedLetters} />
      <Grid title="Huruf Braille" learned={data.braille.learnedLetters} />
      <p>Progres belajarmu saat ini disimpan secara lokal pada peramban perangkat ini.</p>
      {confirm ? (
        <div className="flex flex-wrap items-center gap-3" role="alertdialog" aria-label="Konfirmasi reset">
          <span className="font-semibold">Hapus semua progres?</span>
          <button onClick={() => { reset(); setConfirm(false); }} className="btn bg-coral">Ya, reset</button>
          <button onClick={() => setConfirm(false)} className="btn bg-white">Batal</button>
        </div>
      ) : (
        <button onClick={() => setConfirm(true)} className="btn bg-white">Reset data belajar</button>
      )}
    </div>
  );
}
