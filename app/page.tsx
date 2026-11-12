import Link from "next/link";
import Mascot from "@/components/Mascot";
import Reveal from "@/components/Reveal";

const CHIPS = [
  { t: "A", c: "bg-sun", p: "left-[2%] top-[8%]", d: "0s" }, { t: "⠿", c: "bg-grape text-white", p: "right-[4%] top-[4%]", d: ".6s" },
  { t: "K", c: "bg-coral", p: "left-[6%] bottom-[6%]", d: "1.1s" }, { t: "⠓", c: "bg-mint", p: "right-[8%] bottom-[10%]", d: ".3s" },
];

export default function Home() {
  return (
    <>
      <section className="relative mx-auto grid max-w-6xl items-center gap-8 overflow-hidden px-4 pb-16 pt-12 md:grid-cols-2 md:pt-20">
        {CHIPS.map((c) => (
          <span key={c.t + c.p} aria-hidden="true" style={{ animationDelay: c.d }} className={`absolute hidden h-14 w-14 animate-floaty items-center justify-center rounded-2xl border-4 border-ink font-display text-2xl font-bold shadow-popsm md:flex ${c.c} ${c.p}`}>{c.t}</span>
        ))}
        <div className="relative z-10">
          <h1 className="text-5xl font-bold leading-[1.05] sm:text-6xl">Komunikasi inklusif dimulai dari dua arah.</h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed">Pelajari alfabet Bahasa Isyarat Indonesia (BISINDO) dengan deteksi tangan langsung di kamera perangkatmu, dan pahami logika pola tulis Braille secara interaktif. Tanpa instalasi, tanpa daftar akun.</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/bisindo" className="btn bg-sun">Mulai praktik BISINDO</Link>
            <Link href="/braille" className="btn bg-white">Coba simulator Braille</Link>
          </div>
        </div>
        <div className="relative z-10 mx-auto w-full max-w-md"><Mascot className="w-full" /></div>
      </section>

      <section className="border-y-4 border-ink bg-grape py-16 text-white">
        <Reveal className="mx-auto max-w-4xl px-4">
          <h2 className="text-4xl font-bold">Mengapa kita juga perlu belajar?</h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed">Selama ini, beban beradaptasi dalam komunikasi sehari-hari lebih sering berada di pundak teman-teman Tuli dan Tunanetra. Ketika masyarakat umum turut mengenal dasar isyarat BISINDO dan memahami cara kerja sel Braille, ruang publik, kampus, dan lingkungan pertemanan menjadi jauh lebih ramah dan setara.</p>
        </Reveal>
      </section>

      <section className="mx-auto max-w-6xl space-y-8 px-4 py-16">
        <Reveal>
          <div className="card grid gap-6 bg-sun p-8 md:grid-cols-[1.2fr_1fr] md:items-center">
            <div>
              <h2 className="text-3xl font-bold">Praktik BISINDO dengan kamera</h2>
              <p className="mt-3 text-lg">Deteksi isyarat 1 tangan dan 2 tangan untuk 26 huruf A sampai Z. Tidak punya webcam? Pakai Mode Simulasi Video.</p>
              <Link href="/bisindo" className="btn mt-5 bg-white">Lihat kurikulum</Link>
            </div>
            <div className="flex justify-center gap-3" aria-hidden="true">
              {["1", "2"].map((n) => <span key={n} className="flex h-24 w-24 animate-floaty items-center justify-center rounded-full border-4 border-ink bg-white font-display text-4xl font-bold" style={{ animationDelay: `${Number(n) * 0.4}s` }}>{n}✋</span>)}
            </div>
          </div>
        </Reveal>
        <div className="grid gap-8 md:grid-cols-2">
          <Reveal delay={80}>
            <div className="card h-full bg-mint p-8">
              <h2 className="text-3xl font-bold">Simulator Braille 6 titik</h2>
              <p className="mt-3 text-lg">Klik titik atau ketik dengan F-D-S dan J-K-L seperti tombol Perkins Brailler.</p>
              <Link href="/braille" className="btn mt-5 bg-white">Buka simulator</Link>
            </div>
          </Reveal>
          <Reveal delay={160}>
            <div className="card h-full bg-coral p-8 text-ink">
              <h2 className="text-3xl font-bold">Progres tersimpan di perangkatmu</h2>
              <p className="mt-3 text-lg">Kumpulkan XP, jaga streak harian, dan lihat huruf yang sudah kamu kuasai.</p>
              <Link href="/progress" className="btn mt-5 bg-white">Lihat progres</Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-20">
        <Reveal>
          <div className="card bg-sky p-8">
            <h2 className="text-3xl font-bold">Kameramu sepenuhnya milikmu</h2>
            <p className="mt-3 text-lg leading-relaxed">Seluruh deteksi titik jari dijalankan langsung di dalam peramban perangkatmu menggunakan WebAssembly dan TensorFlow.js. Tidak ada foto atau rekaman wajah maupun tangan yang dikirim atau disimpan ke server mana pun.</p>
          </div>
        </Reveal>
      </section>

      <footer className="border-t-4 border-ink bg-ink py-8 text-center text-white">
        <p className="font-display text-lg">SIGNIFY, karya untuk IT RUSH 2026 (Subtema 5)</p>
        <p className="mt-1 text-sm text-white/80">Dataset BISINDO dari Kaggle (Agung Ma&apos;ruf dan Achmad Noer). Deteksi tangan memakai MediaPipe dan TensorFlow.js.</p>
      </footer>
    </>
  );
}
