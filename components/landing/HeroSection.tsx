import Link from "next/link";
import Mascot from "@/components/Mascot";

const CHIPS = [
  { t: "A", c: "bg-sun", p: "left-[2%] top-[12%]", d: "0s" },
  {
    t: "⠿",
    c: "bg-grape text-white",
    p: "right-[4%] top-[10%]",
    d: ".6s",
  },
  { t: "K", c: "bg-coral", p: "left-[7%] bottom-[12%]", d: "1.1s" },
  { t: "⠓", c: "bg-mint", p: "right-[8%] bottom-[14%]", d: ".3s" },
];

export default function HeroSection() {
  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden">
      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-20">
        {CHIPS.map((chip) => (
          <span
            key={chip.t + chip.p}
            aria-hidden="true"
            style={{ animationDelay: chip.d }}
            className={`absolute hidden h-14 w-14 animate-floaty items-center justify-center rounded-2xl border-4 border-ink font-display text-2xl font-bold shadow-popsm md:flex ${chip.c} ${chip.p}`}
          >
            {chip.t}
          </span>
        ))}

        <div className="relative z-10">
          <span className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-mint px-4 py-2 text-sm font-bold shadow-popsm">
            <span className="h-2.5 w-2.5 rounded-full bg-ink" />
            Belajar komunikasi inklusif
          </span>

          <h1 className="mt-6 text-5xl font-bold leading-[1.05] sm:text-6xl lg:text-7xl">
            Komunikasi inklusif dimulai dari{" "}
            <span className="relative inline-block">
              dua arah.
              <span
                aria-hidden="true"
                className="absolute -bottom-1 left-0 -z-10 h-3 w-full -rotate-1 bg-sun"
              />
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed">
            Pelajari alfabet Bahasa Isyarat Indonesia (BISINDO) dengan deteksi
            tangan langsung di kamera perangkatmu, dan pahami logika pola tulis
            Braille secara interaktif. Tanpa instalasi, tanpa daftar akun.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/bisindo" className="btn bg-sun">
              Mulai praktik BISINDO
            </Link>

            <Link href="/braille" className="btn bg-white">
              Coba simulator Braille
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-semibold">
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full border-2 border-ink bg-mint" />
              Interaktif
            </span>
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full border-2 border-ink bg-sun" />
              Gratis dipelajari
            </span>
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full border-2 border-ink bg-coral" />
              Tanpa akun
            </span>
          </div>
        </div>

        <div className="relative z-10 mx-auto w-full max-w-md">
          <div
            aria-hidden="true"
            className="absolute inset-8 rotate-6 rounded-[3rem] border-4 border-ink bg-sun"
          />
          <div className="relative">
            <Mascot className="w-full" />
          </div>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full border-4 border-ink bg-mint opacity-70"
      />
      <div
        aria-hidden="true"
        className="absolute -right-16 top-1/3 h-40 w-40 rounded-full border-4 border-ink bg-coral opacity-60"
      />
    </section>
  );
}