"use client";
import {Type, Edit, ChevronDown, Zap} from "react-feather";

export default function BrailleWorks() {
    return (<>
{/* BRAILLE EDUCATION - INTERACTIVE */}
<section className="card mt-6 sm:mt-8 overflow-hidden bg-sky p-3.5 sm:p-6">
  {/* Header */}
  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
    <div>
      <span className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
        <span className="h-2 w-2 rounded-full bg-grape" />
        Kenali lebih dekat
      </span>
      <h2 className="mt-2 sm:mt-3 text-xl font-bold sm:text-2xl">
        Dunia Braille
      </h2>
      <p className="mt-1 text-xs sm:text-sm text-ink/70">
        Kenali huruf Braille dan pelajari cara menyampaikan informasi kepada teman tunanetra.
      </p>
    </div>

    {/* Mini Braille cell */}
    <div className="flex items-center gap-2.5 sm:gap-3 rounded-xl sm:rounded-2xl border-2 border-ink bg-white p-2.5 sm:p-3 shadow-popsm shrink-0 self-start">
      <div className="grid grid-cols-2 gap-1">
        {[1, 2, 3, 4, 5, 6].map((dot) => (
          <span
            key={dot}
            className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full border border-ink bg-grape"
          />
        ))}
      </div>
      <div>
        <p className="text-base sm:text-lg font-black leading-none">6 titik</p>
        <p className="mt-0.5 sm:mt-1 text-[10px] font-medium text-ink/60">
          1 sel Braille
        </p>
      </div>
    </div>
  </div>

  {/* Interactive cards */}
  <div className="mt-4 sm:mt-6 grid gap-3 sm:gap-4 sm:grid-cols-3">

    {/* CARD 1 */}
    <details className="group rounded-xl sm:rounded-2xl border-2 border-ink bg-white shadow-popsm transition-all duration-200 hover:-translate-y-1 hover:shadow-pop">
      <summary className="flex cursor-pointer list-none flex-col p-3.5 sm:p-4 [&::-webkit-details-marker]:hidden">
        <div className="flex items-center justify-between">
          <span className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl border-2 border-ink bg-grape text-xl sm:text-2xl">
            ⠿
          </span>
          <span className="rounded-full bg-grape/15 px-2.5 py-0.5 text-[10px] font-bold text-ink">
            DASAR
          </span>
        </div>

        <h3 className="mt-3 sm:mt-4 font-bold text-sm sm:text-base">Sistem enam titik</h3>
        <p className="mt-1 text-[11px] sm:text-xs leading-relaxed text-ink/65">
          Bagaimana membentuk huruf dan simbol?
        </p>

        <div className="mt-3 sm:mt-4 flex items-center justify-between border-t border-ink/10 pt-2.5 sm:pt-3 text-xs font-bold text-grape">
          <span className="group-open:hidden">Pelajari lebih lanjut</span>
          <span className="hidden group-open:inline">Tutup penjelasan</span>
          <span className="transition-transform group-open:rotate-180"><ChevronDown className="h-4 w-4" /></span>
        </div>
      </summary>

      <div className="border-t-2 border-ink/10 bg-grape/10 p-3.5 sm:p-4">
        <p className="text-xs sm:text-sm leading-snug">
          Sistem Braille menggunakan kombinasi enam titik timbul yang disusun
          dalam dua kolom dan tiga baris. Kombinasi titik tersebut membentuk
          huruf, angka, serta simbol yang dibaca melalui indra peraba.
        </p>
        <div className="mt-3 flex justify-center rounded-xl bg-white p-2.5 sm:p-3">
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4, 5, 6].map((dot) => (
              <span key={dot} className="h-4 w-4 sm:h-5 sm:w-5 rounded-full border-2 border-ink bg-grape" />
            ))}
          </div>
        </div>
      </div>
    </details>

    {/* CARD 2 */}
    <details className="group rounded-xl sm:rounded-2xl border-2 border-ink bg-white shadow-popsm transition-all duration-200 hover:-translate-y-1 hover:shadow-pop">
      <summary className="flex cursor-pointer list-none flex-col p-3.5 sm:p-4 [&::-webkit-details-marker]:hidden">
        <div className="flex items-center justify-between">
          <span className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl border-2 border-ink bg-coral">
            <Type className="h-5 w-5 sm:h-6 sm:w-6" />
          </span>
          <span className="rounded-full bg-coral/20 px-2.5 py-0.5 text-[10px] font-bold text-ink">
            MANUAL
          </span>
        </div>

        <h3 className="mt-3 sm:mt-4 font-bold text-sm sm:text-base">Perkins Brailler</h3>
        <p className="mt-1 text-[11px] sm:text-xs leading-relaxed text-ink/65">
          Mengenal mesin ketik khusus untuk menulis Braille.
        </p>

        <div className="mt-3 sm:mt-4 flex items-center justify-between border-t border-ink/10 pt-2.5 sm:pt-3 text-xs font-bold text-coral">
          <span className="group-open:hidden">Pelajari lebih lanjut</span>
          <span className="hidden group-open:inline">Tutup penjelasan</span>
          <span className="transition-transform group-open:rotate-180"><ChevronDown className="h-4 w-4" /></span>
        </div>
      </summary>

      <div className="border-t-2 border-ink/10 bg-coral/10 p-3.5 sm:p-4">
        <p className="text-xs sm:text-sm leading-snug">
          Perkins Brailler merupakan mesin khusus untuk menulis Braille.
          Mesin ini memiliki enam tombol utama yang mewakili enam titik
          dalam satu sel Braille. Kombinasi tombol ditekan untuk menghasilkan
          karakter Braille.
        </p>
        <div className="mt-3 flex justify-center rounded-xl bg-white p-2.5 sm:p-3">
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {["1", "2", "3", "4", "5", "6"].map((key) => (
              <span key={key} className="flex h-8 sm:h-[34px] w-8 sm:w-9 items-center justify-center rounded-lg border-2 border-ink bg-coral text-xs font-black">
                {key}
              </span>
            ))}
          </div>
        </div>
      </div>
    </details>

    {/* CARD 3 */}
    <details className="group rounded-xl sm:rounded-2xl border-2 border-ink bg-white shadow-popsm transition-all duration-200 hover:-translate-y-1 hover:shadow-pop">
      <summary className="flex cursor-pointer list-none flex-col p-3.5 sm:p-4 [&::-webkit-details-marker]:hidden">
        <div className="flex items-center justify-between">
          <span className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl border-2 border-ink bg-mint">
            <Edit className="h-5 w-5 sm:h-6 sm:w-6" />
          </span>
          <span className="rounded-full bg-mint/30 px-2.5 py-0.5 text-[10px] font-bold text-ink">
            DIGITAL
          </span>
        </div>

        <h3 className="mt-3 sm:mt-4 font-bold text-sm sm:text-base">Braille Screen Input</h3>
        <p className="mt-1 text-[11px] sm:text-xs leading-relaxed text-ink/65">
          Menulis Braille langsung melalui layar sentuh.
        </p>

        <div className="mt-3 sm:mt-4 flex items-center justify-between border-t border-ink/10 pt-2.5 sm:pt-3 text-xs font-bold text-mint">
          <span className="group-open:hidden">Pelajari lebih lanjut</span>
          <span className="hidden group-open:inline">Tutup penjelasan</span>
          <span className="transition-transform group-open:rotate-180"><ChevronDown className="h-4 w-4" /></span>
        </div>
      </summary>

      <div className="border-t-2 border-ink/10 bg-mint/15 p-3.5 sm:p-4">
        <p className="text-xs sm:text-sm leading-snug">
          Braille Screen Input merupakan fitur pada perangkat digital
          yang memungkinkan pengguna memasukkan karakter Braille melalui
          layar sentuh. Pengguna dapat mengetuk kombinasi titik untuk
          membentuk karakter.
        </p>
        <div className="mt-3 flex justify-center rounded-xl bg-white p-2.5 sm:p-3">
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
            {[1, 2, 3, 4, 5, 6].map((dot) => (
              <span key={dot} className="flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full border-2 border-ink bg-mint text-[9px] sm:text-[10px] font-bold">
                {dot}
              </span>
            ))}
          </div>
        </div>
      </div>
    </details>
  </div>

  {/* Simulator information */}
  <div className="mt-4 sm:mt-5 flex items-start gap-2.5 sm:gap-3 rounded-xl border-2 border-ink/20 bg-white/70 p-3">
    <span className="shrink-0 mt-0.5"><Zap className="h-5 w-5 sm:h-6 sm:w-6 text-ink/75" /></span>
    <p className="text-xs leading-snug text-ink/75">
      <strong>Tips simulator:</strong> SIGNIFY menggunakan tombol F-D-S
      untuk titik 1–3 dan J-K-L untuk titik 4–6. Pemetaan ini merupakan
      pengaturan keyboard simulator, bukan susunan fisik tombol pada
      semua perangkat Braille.
    </p>
  </div>
</section>
</>);}