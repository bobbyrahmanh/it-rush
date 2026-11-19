
import Link from "next/link";
import Mascot from "@/components/Mascot";

const CHIPS = [
  { t: "A", c: "bg-sun", p: "left-[-7%] top-[7%]", r: "rotate-6", d: "0s" },
  {
    t: "⠿",
    c: "bg-grape text-white",
    p: "right-[4%] top-[10%]",
    r: "-rotate-6",
    d: ".6s",
  },
  { t: "K", c: "bg-coral", p: "left-[-5%] bottom-[22%]", r: "rotate-12", d: "1.1s" },
  { t: "⠓", c: "bg-mint", p: "right-[8%] bottom-[14%]", r: "-rotate-6", d: ".3s" },
];

export default function HeroSection() {
  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden">
      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-6 sm:gap-10 px-4 py-8 sm:py-16 md:grid-cols-2 md:py-20">
        {CHIPS.map((chip) => (
          <span
            key={chip.t + chip.p}
            aria-hidden="true"
            className={`absolute hidden md:flex ${chip.p} ${chip.r}`}
          >
            <span
              style={{ animationDelay: chip.d }}
              className={`flex h-14 w-14 animate-floaty items-center justify-center rounded-2xl border-4 border-ink font-display text-2xl font-bold shadow-popsm ${chip.c}`}
            >
              {chip.t}
            </span>
          </span>
        ))}

        <div className="relative z-10">
          <span className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-mint px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold shadow-popsm">
            <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-ink" />
            Inclusive Learning for Sustainable Communities
          </span>

          <h1 className="mt-4 sm:mt-6 text-3xl font-bold leading-[1.08] sm:text-5xl lg:text-7xl">
            Pengetahuan{" "}
            <span className="relative inline-block">
              untuk semua.
              <span
                aria-hidden="true"
                className="absolute -bottom-1 left-0 -z-10 h-2.5 sm:h-3 w-full -rotate-1 bg-sun"
              />
            </span>
          </h1>

          <p className="mt-3 sm:mt-6 max-w-xl text-sm leading-relaxed sm:text-lg sm:leading-snug">
            SIGNIFY menghadirkan pembelajaran komunikasi inklusif melalui
            pengenalan alfabet BISINDO berbasis AI dan simulator Braille
            interaktif. Kami percaya bahwa akses terhadap pendidikan dan
            informasi, termasuk tentang keberlanjutan pesisir dan hutan tropis,
            perlu terbuka bagi semua orang.
          </p>

          <div className="mt-5 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Link href="/bisindo" className="btn bg-sun text-center">
              Mulai praktik BISINDO
            </Link>

            <Link href="/braille" className="btn bg-white text-center">
              Coba simulator Braille
            </Link>
          </div>

          <div className="mt-6 sm:mt-10 flex flex-wrap items-center gap-x-4 sm:gap-x-6 gap-y-2 text-xs sm:text-sm font-semibold">
            <span className="flex items-center gap-1.5 sm:gap-2">
              <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full border-2 border-ink bg-mint" />
              Interaktif
            </span>
            <span className="flex items-center gap-1.5 sm:gap-2">
              <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full border-2 border-ink bg-sun" />
              Gratis dipelajari
            </span>
            <span className="flex items-center gap-1.5 sm:gap-2">
              <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full border-2 border-ink bg-coral" />
              Tanpa akun
            </span>
          </div>
        </div>

        <div className="relative z-10 mx-auto w-full max-w-[200px] sm:max-w-xs md:max-w-md mt-4 sm:mt-0">
          <div
            aria-hidden="true"
            className="absolute inset-4 sm:inset-8 rotate-6 rounded-2xl sm:rounded-[3rem] border-2 sm:border-4 border-ink bg-sun"
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
