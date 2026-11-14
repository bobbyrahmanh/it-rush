import Reveal from "@/components/Reveal";

export default function PrivacySection() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-20 pt-8">
      <Reveal>
        <div className="card grid gap-8 bg-sky p-8 md:grid-cols-[1fr_auto] md:items-center md:p-10">
          <div>
            <span className="inline-block rounded-full border-2 border-ink bg-white px-4 py-2 text-sm font-bold">
              Privacy matters
            </span>

            <h2 className="mt-5 text-3xl font-bold sm:text-4xl">
              Belajar dengan aman, <br></br> teknologi yang bertanggung jawab.
            </h2>

            <p className="mt-4 max-w-2xl text-lg leading-relaxed">
              Seluruh deteksi titik jari dijalankan langsung di dalam peramban
              perangkatmu menggunakan WebAssembly dan TensorFlow.js. Tidak ada
              foto atau rekaman wajah maupun tangan yang dikirim atau disimpan
              ke server mana pun.
            </p>
          </div>

          <div
            aria-hidden="true"
            className="mx-auto flex h-36 w-36 items-center justify-center rounded-full border-4 border-ink bg-white shadow-popsm"
          >
            <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-ink bg-mint">
              <span className="text-5xl">🔒</span>
              <span className="absolute -right-4 -top-4 flex h-10 w-10 items-center justify-center rounded-full border-2 border-ink bg-sun text-xl">
                ✓
              </span>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}