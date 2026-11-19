
import Link from "next/link";

const FOOTER_LINKS = [
  { href: "/", label: "Beranda" },
  { href: "/bisindo", label: "Belajar BISINDO" },
  { href: "/braille", label: "Belajar Braille" },
  { href: "/progress", label: "Progres Saya" },
  { href: "/login", label: "Masuk / Akun Demo" },
];

export default function FooterSection() {
  return (
    <footer className="border-t-2 sm:border-t-4 border-ink bg-ink">
      {/* MAIN FOOTER */}
      <div className="mx-auto max-w-6xl px-4 pt-6 sm:pt-10">
        <div className="grid gap-6 sm:gap-12 md:grid-cols-[1.4fr_0.8fr_0.8fr]">

          {/* BRAND */}
          <div>
            <Link
              href="/"
              className="inline-block font-display text-2xl sm:text-3xl font-bold tracking-tight text-paper"
            >
              SIGN<span className="text-grape">IFY</span>
            </Link>

            <p className="mt-2.5 sm:mt-4 max-w-sm text-xs sm:text-sm leading-snug text-paper/75">
              Mengenal BISINDO dan Braille melalui pembelajaran interaktif sebagai langkah awal membangun komunikasi inklusif dan memperluas akses informasi bagi semua orang.
            </p>

            <div className="mt-4 sm:mt-6 inline-flex items-center gap-2 rounded-full border-2 border-ink bg-mint px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold shadow-popsm">
              <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-ink" />
              Learn, understand, and connect.
            </div>
          </div>

          {/* NAVIGATION */}
          <div>
            <h3 className="font-display text-base sm:text-lg font-bold text-paper">
              Navigasi
            </h3>

            <ul className="mt-3 sm:mt-5 space-y-1 sm:space-y-3">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-paper/75 transition hover:translate-x-1 hover:text-sun"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ABOUT THE PROJECT */}
          <div className="md: -ml-10">
            <h3 className="font-display text-base sm:text-lg font-bold text-paper">
              Tentang Proyek
            </h3>

            <p className="mt-3 sm:mt-5 text-sm sm:text-sm leading-relaxed text-paper/75">
              SIGNIFY dikembangkan sebagai bagian dari IT RUSH 2026
              dengan fokus pada pendidikan, tata kelola, dan teknologi inklusif.
            </p>

            <div className="mt-3 sm:mt-4 flex flex-wrap gap-1.5 sm:gap-2">
              <span className="rounded-full border-2 border-ink bg-sun px-2.5 sm:px-3 py-0.5 sm:py-1 text-[11px] sm:text-xs font-bold">
                IT RUSH 2026
              </span>
              <span className="rounded-full border-2 border-ink bg-white px-2.5 sm:px-3 py-0.5 sm:py-1 text-[11px] sm:text-xs font-bold">
                Subtema 5
              </span>
            </div>
          </div>
        </div>

        {/* TECHNOLOGY INFORMATION */}
        <div className="mt-6 sm:mt-7 rounded-xl sm:rounded-2xl border-2 sm:border-4 border-ink bg-grape p-3.5 sm:p-5 shadow-popsm">
          <div className="grid gap-3.5 sm:gap-5 md:grid-cols-[1fr_1fr] md:items-center">
            <div>
              <h3 className="font-display text-sm sm:text-base font-bold text-paper">
                Teknologi yang digunakan
              </h3>
              <p className="mt-1 sm:mt-2 text-xs sm:text-sm leading-relaxed text-paper/75">
                Mengintegrasikan teknologi pengenalan gestur tangan dan
                pembelajaran interaktif untuk mendukung pengalaman belajar.
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5 sm:gap-2 md:justify-end">
              {["Next.js", "TensorFlow.js", "MediaPipe", "WebAssembly", "Supabase"].map(
                (tech) => (
                  <span
                    key={tech}
                    className="rounded-full border-2 border-ink bg-paper px-2.5 sm:px-3 py-1 sm:py-2 text-[10px] sm:text-xs font-bold"
                  >
                    {tech}
                  </span>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* COPYRIGHT */}
      <div className="border-t border-ink/40 bg-ink text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 sm:gap-3 px-4 py-4 sm:py-6 text-center sm:flex-row sm:text-left">
          <p className="text-xs sm:text-sm font-semibold">
            © {new Date().getFullYear()} SIGNIFY. All rights reserved.
          </p>

          <p className="text-[11px] sm:text-xs text-white/70">
            A project for inclusive communication.
          </p>
        </div>
      </div>
    </footer>
  );
}
