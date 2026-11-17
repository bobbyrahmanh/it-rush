"use client";
import {Type, Edit, ChevronDown, Zap} from "react-feather";

export default function BrailleWorks() {
    return (<>
{/* BRAILLE EDUCATION - INTERACTIVE */}
<section className="card mt-8 overflow-hidden bg-sky p-5 sm:p-6">
  {/* Header */}
  <div className="flex flex-wrap items-start justify-between gap-3">
    <div>
      <span className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
        <span className="h-2 w-2 rounded-full bg-grape" />
        Kenali lebih dekat
      </span>
      <h2 className="mt-3 text-xl font-bold sm:text-2xl">
        Dunia Braille
      </h2>
      <p className="mt-1 text-sm text-ink/70">
        Kenali cara kerja dan teknologi yang membantu penyandang tunanetra membaca dan menulis.
      </p>
    </div>

    {/* Mini Braille cell */}
    <div className="flex items-center gap-3 rounded-2xl border-2 border-ink bg-white p-3 shadow-popsm">
      <div className="grid grid-cols-2 gap-1">
        {[1, 2, 3, 4, 5, 6].map((dot) => (
          <span
            key={dot}
            className="h-3 w-3 rounded-full border border-ink bg-grape"
          />
        ))}
      </div>
      <div>
        <p className="text-lg font-black leading-none">6 titik</p>
        <p className="mt-1 text-[10px] font-medium text-ink/60">
          1 sel Braille
        </p>
      </div>
    </div>
  </div>

  {/* Interactive cards */}
  <div className="mt-6 grid gap-4 sm:grid-cols-3">

    {/* CARD 1 */}
    <details className="group rounded-2xl border-2 border-ink bg-white shadow-popsm transition-all duration-200 hover:-translate-y-1 hover:shadow-pop">
      <summary className="flex cursor-pointer list-none flex-col p-4 [&::-webkit-details-marker]:hidden">
        <div className="flex items-center justify-between">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-ink bg-grape text-2xl">
            ⠿
          </span>
          <span className="rounded-full bg-grape/15 px-2.5 py-1 text-[10px] font-bold text-ink">
            DASAR
          </span>
        </div>

        <h3 className="mt-4 font-bold">Sistem enam titik</h3>
        <p className="mt-1 text-xs leading-relaxed text-ink/65">
          Bagaimana membentuk huruf dan simbol?
        </p>

        <div className="mt-4 flex items-center justify-between border-t border-ink/10 pt-3 text-xs font-bold text-grape">
          <span className="group-open:hidden">Pelajari lebih lanjut</span>
          <span className="hidden group-open:inline">Tutup penjelasan</span>
          <span className="transition-transform group-open:rotate-180"><ChevronDown /></span>
        </div>
      </summary>

      <div className="border-t-2 border-ink/10 bg-grape/10 p-4">
        <p className="text-sm leading-snug">
          Sistem Braille menggunakan kombinasi enam titik timbul yang disusun
          dalam dua kolom dan tiga baris. Kombinasi titik tersebut membentuk
          huruf, angka, serta simbol yang dibaca melalui indra peraba.
        </p>
        <div className="mt-3 flex justify-center rounded-xl bg-white p-3">
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4, 5, 6].map((dot) => (
              <span key={dot} className="h-5 w-5 rounded-full border-2 border-ink bg-grape" />
            ))}
          </div>
        </div>
      </div>
    </details>

    {/* CARD 2 */}
    <details className="group rounded-2xl border-2 border-ink bg-white shadow-popsm transition-all duration-200 hover:-translate-y-1 hover:shadow-pop">
      <summary className="flex cursor-pointer list-none flex-col p-4 [&::-webkit-details-marker]:hidden">
        <div className="flex items-center justify-between">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-ink bg-coral">
            <Type className="h-6 w-6" />
          </span>
          <span className="rounded-full bg-coral/20 px-2.5 py-1 text-[10px] font-bold text-ink">
            MANUAL
          </span>
        </div>

        <h3 className="mt-4 font-bold">Perkins Brailler</h3>
        <p className="mt-1 text-xs leading-relaxed text-ink/65">
          Mengenal mesin ketik khusus untuk menulis Braille.
        </p>

        <div className="mt-4 flex items-center justify-between border-t border-ink/10 pt-3 text-xs font-bold text-coral">
          <span className="group-open:hidden">Pelajari lebih lanjut</span>
          <span className="hidden group-open:inline">Tutup penjelasan</span>
          <span className="transition-transform group-open:rotate-180"><ChevronDown /></span>
        </div>
      </summary>

      <div className="border-t-2 border-ink/10 bg-coral/10 p-4">
        <p className="text-sm leading-snug">
          Perkins Brailler merupakan mesin khusus untuk menulis Braille.
          Mesin ini memiliki enam tombol utama yang mewakili enam titik
          dalam satu sel Braille. Kombinasi tombol ditekan untuk menghasilkan
          karakter Braille.
        </p>
        <div className="mt-3 flex justify-center rounded-xl bg-white p-3">
          <div className="grid grid-cols-3 gap-2">
            {["1", "2", "3", "4", "5", "6"].map((key) => (
              <span key={key} className="flex h-[34px] w-9 items-center justify-center rounded-lg border-2 border-ink bg-coral text-xs font-black">
                {key}
              </span>
            ))}
          </div>
        </div>
      </div>
    </details>

    {/* CARD 3 */}
    <details className="group rounded-2xl border-2 border-ink bg-white shadow-popsm transition-all duration-200 hover:-translate-y-1 hover:shadow-pop">
      <summary className="flex cursor-pointer list-none flex-col p-4 [&::-webkit-details-marker]:hidden">
        <div className="flex items-center justify-between">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-ink bg-mint">
            <Edit className="h-6 w-6" />
          </span>
          <span className="rounded-full bg-mint/30 px-2.5 py-1 text-[10px] font-bold text-ink">
            DIGITAL
          </span>
        </div>

        <h3 className="mt-4 font-bold">Braille Screen Input</h3>
        <p className="mt-1 text-xs leading-relaxed text-ink/65">
          Menulis Braille langsung melalui layar sentuh.
        </p>

        <div className="mt-4 flex items-center justify-between border-t border-ink/10 pt-3 text-xs font-bold text-mint">
          <span className="group-open:hidden">Pelajari lebih lanjut</span>
          <span className="hidden group-open:inline">Tutup penjelasan</span>
          <span className="transition-transform group-open:rotate-180"><ChevronDown /></span>
        </div>
      </summary>

      <div className="border-t-2 border-ink/10 bg-mint/15 p-4">
        <p className="text-sm leading-snug">
          Braille Screen Input merupakan fitur pada perangkat digital
          yang memungkinkan pengguna memasukkan karakter Braille melalui
          layar sentuh. Pengguna dapat mengetuk kombinasi titik untuk
          membentuk karakter.
        </p>
        <div className="mt-3 flex justify-center rounded-xl bg-white p-3">
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4, 5, 6].map((dot) => (
              <span key={dot} className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-ink bg-mint text-[10px] font-bold">
                {dot}
              </span>
            ))}
          </div>
        </div>
      </div>
    </details>
  </div>

  {/* Simulator information */}
  <div className="mt-5 flex gap-3 rounded-xl border-2 border-ink/20 bg-white/70 p-3">
    <span className="text-xl"><Zap className="h-6 w-6 text-ink/75" /></span>
    <p className="text-xs leading-snug text-ink/75">
      <strong>Tips simulator:</strong> SIGNIFY menggunakan tombol F-D-S
      untuk titik 1–3 dan J-K-L untuk titik 4–6. Pemetaan ini merupakan
      pengaturan keyboard simulator, bukan susunan fisik tombol pada
      semua perangkat Braille.
    </p>
  </div>
</section>
</>);}