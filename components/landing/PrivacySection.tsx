import Reveal from "@/components/Reveal";
import { Lock } from "react-feather";

export default function PrivacySection() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-10 sm:pb-20 pt-4 sm:pt-8">
      <Reveal>
        <div className="card grid gap-6 sm:gap-8 bg-sky p-5 sm:p-8 md:grid-cols-[1fr_auto] md:items-center md:p-10">
          <div>
            <span className="inline-block rounded-full border-2 border-ink bg-white px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold">
              Privacy matters
            </span>

            <h2 className="mt-3 sm:mt-5 text-2xl font-bold sm:text-3xl md:text-4xl">
              Belajar dengan aman, <br></br> teknologi yang bertanggung jawab.
            </h2>

            <p className="mt-2.5 sm:mt-4 text-sm leading-tight sm:text-lg sm:leading-relaxed text-ink/85">
              Seluruh deteksi titik jari dijalankan langsung di dalam peramban
              perangkatmu menggunakan WebAssembly dan TensorFlow.js. Tidak ada
              foto atau rekaman wajah maupun tangan yang dikirim atau disimpan
              ke server mana pun.
            </p>
          </div>

          <div
            aria-hidden="true"
            className="hidden md:mr-10 mx-auto md:flex h-24 w-24 sm:h-36 sm:w-36 items-center justify-center rounded-full border-2 sm:border-4 border-ink bg-white shadow-popsm"
          >
            <div className="relative flex h-14 w-14 sm:h-20 sm:w-20 items-center justify-center rounded-xl sm:rounded-2xl border-2 sm:border-4 border-ink bg-mint">
              <span className="text-2xl sm:text-5xl"><Lock className="w-10 h-10"/></span>
              <span className="absolute -right-2.5 -top-2.5 sm:-right-4 sm:-top-4 flex h-7 w-7 sm:h-10 sm:w-10 items-center justify-center rounded-full border-2 border-ink bg-sun text-sm sm:text-xl">
                ✓
              </span>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}