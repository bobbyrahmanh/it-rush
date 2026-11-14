import Reveal from "@/components/Reveal";

export default function AboutSection() {
  return (
    <section className="border-y-4 border-ink bg-grape py-20 text-white">
      <Reveal className="mx-auto max-w-6xl px-4">
        <div className="grid gap-10 md:grid-cols-[1.3fr_0.7fr] md:items-center">
          <div>
            <span className="inline-block rounded-full border-2 border-white/70 px-4 py-2 text-sm font-bold">
              Tentang SIGNIFY
            </span>

            <h2 className="mt-6 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
              Inklusi bukan hanya tentang memberi ruang, tetapi juga belajar
              memahami.
            </h2>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/90">
              Selama ini, beban beradaptasi dalam komunikasi sehari-hari lebih
              sering berada di pundak teman-teman Tuli dan Tunanetra. SIGNIFY
              mengajak masyarakat umum untuk ikut mengambil bagian dengan
              mengenal dasar isyarat BISINDO dan memahami pola Braille.
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-xs">
            <div className="rotate-3 rounded-3xl border-4 border-ink bg-sun p-6 text-ink shadow-pop">
              <div className="font-display text-6xl font-bold">01</div>
              <p className="mt-3 text-xl font-bold">
                Belajar memahami.
              </p>
              <div className="my-5 h-1 rounded-full bg-ink" />
              <div className="flex gap-3">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl border-4 border-ink bg-white text-2xl font-bold">
                  A
                </span>
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl border-4 border-ink bg-mint text-2xl font-bold">
                  ⠿
                </span>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}