
"use client";

import { useState } from "react";
import CameraSlot from "@/components/CameraSlot";
import WordCameraSlot from "@/components/WordCameraSlot";
import GuessTheSign from "@/components/GuessTheSign";
import Reveal from "@/components/Reveal";
import { UNITS, WORD_ITEMS, handsOf } from "@/lib/bisindo";
import { speak } from "@/lib/audio";
import { useProgress } from "@/lib/storage/useProgress";
import { Volume2, Camera, BookOpen, CheckCircle, Check, Globe, Shield, HelpCircle, type Icon } from "react-feather";

type Mode = "learn" | "guess";

const modes: { id: Mode; icon: Icon; label: string; desc: string }[] = [
  { id: "learn", icon: BookOpen, label: "Belajar", desc: "Kenali alfabet & kosakata" },
  { id: "guess", icon: HelpCircle, label: "Guess the Sign", desc: "Tebak huruf dari isyarat" },
];

function NatureIllustration() {
  return (
    <div
      className="nature-scene relative isolate h-52 overflow-hidden rounded-3xl border-4 border-ink bg-[#DDF3FF] sm:h-64"
      aria-label="Ilustrasi ekosistem pesisir dan hutan tropis"
    >
      {/* Matahari */}
      <div className="nature-sun absolute right-[13%] top-[12%] h-16 w-16 rounded-full border-4 border-ink bg-sun sm:h-20 sm:w-20" />

      {/* Awan */}
      <div className="cloud cloud-one absolute left-[13%] top-[18%] h-5 w-16 rounded-full bg-white sm:w-24" />
      <div className="cloud cloud-two absolute left-[55%] top-[35%] h-4 w-12 rounded-full bg-white" />

      {/* Bukit / garis hutan */}
      <svg
        viewBox="0 0 700 260"
        preserveAspectRatio="none"
        className="absolute bottom-0 h-[85%] w-full"
        aria-hidden="true"
      >
        <path
          d="M0 135 Q90 35 190 110 Q300 0 405 100 Q540 10 700 100 L700 260 L0 260Z"
          fill="#19B5A5"
          stroke="#1B1B3A"
          strokeWidth="4"
        />
        <path
          d="M0 175 Q130 105 245 170 Q370 90 500 165 Q610 110 700 160 L700 260 L0 260Z"
          fill="#238B69"
          stroke="#1B1B3A"
          strokeWidth="4"
        />

        {/* Batang pohon */}
        <path
          d="M125 160 L125 95 M110 160 L110 112 M140 160 L140 110"
          stroke="#79523B"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d="M125 100 Q75 80 95 45 Q125 15 150 52 Q180 28 190 68 Q183 105 125 100Z"
          fill="#FFC93C"
          stroke="#1B1B3A"
          strokeWidth="4"
        />
        <path
          d="M575 150 L575 80"
          stroke="#79523B"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d="M575 90 Q530 80 540 45 Q565 15 585 42 Q620 20 635 60 Q635 95 575 90Z"
          fill="#19B5A5"
          stroke="#1B1B3A"
          strokeWidth="4"
        />

        {/* Pesisir dan air */}
        <path
          d="M0 195 Q100 170 200 205 Q300 235 410 190 Q540 160 700 200 L700 260 L0 260Z"
          fill="#FFC76D"
          stroke="#1B1B3A"
          strokeWidth="4"
        />
        <path
          d="M0 220 Q100 200 190 220 Q300 240 410 215 Q550 185 700 220 L700 260 L0 260Z"
          fill="#51B9E9"
          stroke="#1B1B3A"
          strokeWidth="4"
        />
        <path
          d="M35 235 Q80 225 125 235 M280 244 Q320 232 365 240 M510 225 Q560 215 610 225"
          stroke="#FFFFFF"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>

      {/* Daun dekoratif bergerak */}
      <div className="floating-leaf absolute left-[38%] top-[15%] text-mint">
        
      </div>
      <div className="floating-leaf leaf-delay absolute right-[32%] top-[12%] text-grape">
        
      </div>

      <div className="absolute bottom-3 left-3 z-10 flex gap-2">
        <span className="flex items-center gap-1 rounded-full border-2 border-ink bg-white px-3 py-1 text-[10px] font-bold sm:text-xs">
           HUTAN
        </span>
        <span className="flex items-center gap-1 rounded-full border-2 border-ink bg-white px-3 py-1 text-[10px] font-bold sm:text-xs">
           PESISIR
        </span>
      </div>
    </div>
  );
}

function EnvironmentContext() {
  return (
    <Reveal>
      <section className="card relative mb-10 overflow-hidden bg-sun p-6 sm:p-8">
        <div className="relative z-10 grid items-center gap-7">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-white px-3 py-1.5 text-xs font-bold">
              <Globe size={14} />
              INCLUSIVE ENVIRONMENTAL AWARENESS
            </span>

            <h2 className="mt-4 text-2xl font-bold leading-snug sm:text-3xl">
              Menjaga lingkungan juga membutuhkan komunikasi yang inklusif.
            </h2>

            <p className="mt-3 leading-snug text-ink/80">
              Informasi tentang kebersihan pesisir, pelestarian mangrove, hingga perlindungan hutan tropis perlu dapat diakses oleh seluruh lapisan masyarakat. Karena itu, setiap orang perlu
              memiliki kesempatan untuk mengenal cara berkomunikasi yang beragam.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border-2 border-ink bg-white px-3 py-1.5 text-xs font-bold">
                Akses informasi
              </span>
              <span className="rounded-full border-2 border-ink bg-mint px-3 py-1.5 text-xs font-bold">
                Kesadaran lingkungan
              </span>
              <span className="rounded-full border-2 border-ink bg-coral px-3 py-1.5 text-xs font-bold">
                Pemberdayaan masyarakat
              </span>
            </div>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="absolute -bottom-12 -right-10 h-40 w-40 rounded-full border-4 border-ink/10 bg-white/20"
        />
      </section>
    </Reveal>
  );
}

export default function BisindoPage() {
  const [mode, setMode] = useState<Mode>("learn");
  const [selState, setSelState] = useState<
    { kind: "letter"; value: string } | { kind: "word"; value: string }
  >({ kind: "letter", value: "A" });

  const sel = selState.kind === "letter" ? selState.value : "";

  const setSel = (value: string) =>
    setSelState({ kind: "letter", value });

  const { data } = useProgress();

  const learned = data.bisindo.learnedLetters;
  const learnedWords = data.bisindo.learnedWords ?? [];

  const selectedWord =
    selState.kind === "word"
      ? WORD_ITEMS.find((w) => w.id === selState.value) ?? WORD_ITEMS[0]
      : null;

  const allLetters = UNITS.flatMap((unit) => unit.letters);

  const learnedCount = allLetters.filter((letter) =>
    learned.includes(letter)
  ).length;

  const oneHandCount = allLetters.filter(
    (letter) => handsOf(letter) === 1
  ).length;

  const twoHandCount = allLetters.length - oneHandCount;

  const letterProgress = allLetters.length
    ? Math.round((learnedCount / allLetters.length) * 100)
    : 0;

  const wordProgress = WORD_ITEMS.length
    ? Math.round((learnedWords.length / WORD_ITEMS.length) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {/* HERO */}
      <Reveal>
        <section className="relative mb-10 overflow-hidden rounded-3xl border-4 border-ink bg-grape p-6 text-white shadow-pop sm:p-9">
          {/* Decorative circles */}
          <div
            aria-hidden="true"
            className="absolute -right-10 -top-10 h-48 w-48 rounded-full border-4 border-white/10 bg-white/5"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-20 right-[30%] h-48 w-48 rounded-full border-4 border-white/10"
          />

          <div className="relative z-10 grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border-2 border-white/40 bg-white/15 px-4 py-2 text-xs font-bold tracking-wide">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-sun" />
                SIGNIFY • INCLUSIVE LEARNING
              </span>

              <h1 className="mt-5 text-4xl font-bold leading-tight sm:text-5xl">
                Kenali BISINDO,
                <span className="block text-sun">
                  Bangun Komunikasi Inklusif.
                </span>
              </h1>

              <p className="mt-4 max-w-xl text-base leading-tight text-white/85 sm:text-lg">
                Pelajari alfabet dan kosakata BISINDO melalui referensi visual serta latihan pengenalan gestur berbasis AI. Mulai dari
                langkah sederhana untuk membangun pemahaman komunikasi dengan komunitas Tuli.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <span className="rounded-full border-2 border-white/30 bg-white/10 px-3 py-2 text-xs font-bold">
                  26 Alfabet
                </span>
                <span className="rounded-full border-2 border-white/30 bg-white/10 px-3 py-2 text-xs font-bold">
                  AI Gesture Practice
                </span>
                <span className="rounded-full border-2 border-white/30 bg-white/10 px-3 py-2 text-xs font-bold">
                  Interactive Learning
                </span>
              </div>
            </div>

            {/* Hero illustration */}
            <div className="relative">
              <NatureIllustration />
              <div className="absolute -right-2 -top-5 flex h-14 w-14 animate-floaty items-center justify-center rounded-2xl border-4 border-ink bg-mint text-ink shadow-popsm">
                <BookOpen size={22} />
              </div>
              <div className="absolute -bottom-4 -left-3 flex h-12 w-12 animate-floaty items-center justify-center rounded-2xl border-4 border-ink bg-coral text-white shadow-popsm [animation-delay:0.8s]">
                <Globe size={22} />
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* LEARNING STATISTICS */}
      <Reveal>
        <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="card bg-grape p-4 text-white">
            <p className="text-sm font-medium text-white/80">Alfabet</p>
            <p className="mt-1 text-3xl font-bold">{allLetters.length}</p>
            <p className="text-xs text-white/75">Huruf A–Z</p>
          </div>

          <div className="card bg-sun p-4">
            <p className="text-sm font-medium">Isyarat satu tangan</p>
            <p className="mt-1 text-3xl font-bold">{oneHandCount}</p>
            <p className="text-xs text-ink/70">Huruf</p>
          </div>

          <div className="card bg-mint p-4">
            <p className="text-sm font-medium">Isyarat dua tangan</p>
            <p className="mt-1 text-3xl font-bold">{twoHandCount}</p>
            <p className="text-xs text-ink/70">Huruf</p>
          </div>

          <div className="card bg-white p-4">
            <p className="text-sm font-medium">Sudah dipelajari</p>
            <p className="mt-1 text-3xl font-bold">{learnedCount}</p>
            <p className="text-xs text-ink/70">
              Dari {allLetters.length} huruf
            </p>
          </div>
        </div>
      </Reveal>

      {/* ENVIRONMENTAL CONTEXT */}
      <EnvironmentContext />

      {/* MODE SELECTOR */}
      <section className="mb-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider">Ruang belajar</p>
            <h2 className="font-display text-3xl font-bold">Pilih aktivitasmu!</h2>
          </div>
          <span className="text-sm text-ink/70">Learning by doing</span>
        </div>

        <div
          className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2"
          role="tablist"
          aria-label="Mode BISINDO"
        >
          {modes.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={mode === item.id}
              onClick={() => setMode(item.id)}
              className={`btn min-h-20 text-left transition duration-200 hover:-translate-y-1 ${
                mode === item.id ? "bg-sun shadow-popsm" : "bg-white"
              }`}
            >
              <div className="flex items-center gap-5">
                <span className="text-2xl">
                  <item.icon className="h-8 w-8" />
                </span>
                <div className="flex flex-col">
                  <span className="block text-lg font-bold">{item.label}</span>
                  <span className="block text-xs font-medium">{item.desc}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* GUESS THE SIGN */}
      {mode === "guess" && (
        <section aria-label="Guess the Sign" className="mb-10">
          <GuessTheSign />
        </section>
      )}

      {/* LEARNING AREA */}
      {mode === "learn" && (
      <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
        {/* LEFT COLUMN */}
        <div className="space-y-5">
          <div className="mb-2">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              <h2 className="text-2xl font-bold">Materi Pembelajaran</h2>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-ink/65">
              Kenali bentuk alfabet, pahami referensi visual, dan lanjutkan dengan latihan kosakata BISINDO.
            </p>
          </div>

          {/* ALPHABET UNITS */}
          {UNITS.map((u) => {
            const unitLearned = u.letters.filter((letter) =>
              learned.includes(letter)
            ).length;

            const unitProgress = u.letters.length
              ? Math.round((unitLearned / u.letters.length) * 100)
              : 0;

            return (
              <Reveal key={u.id}>
                <section className={`card p-5 ${u.color}`} aria-labelledby={`u${u.id}`}>
                  <div className="flex items-center justify-between gap-3">
                    <h2 id={`u${u.id}`} className="text-xl font-bold">
                      {u.title}
                    </h2>
                    <span className="shrink-0 rounded-full border-2 border-ink bg-white px-3 py-1 text-xs font-bold">
                      {unitLearned}/{u.letters.length}
                    </span>
                  </div>

                  <div className="mt-3 h-3 overflow-hidden rounded-full border-2 border-ink bg-white">
                    <div
                      className="h-full rounded-full bg-grape transition-all duration-500"
                      style={{ width: `${unitProgress}%` }}
                    />
                  </div>

                  <p className="mt-1 text-xs font-medium">
                    {unitProgress === 100
                      ? "Unit selesai! Semua huruf telah dipelajari."
                      : `${unitLearned} dari ${u.letters.length} huruf telah dipelajari`}
                  </p>

                  <ul className="mt-4 flex flex-wrap gap-3">
                    {u.letters.map((l) => (
                      <li key={l}>
                        <button
                          type="button"
                          onClick={() => {
                            setSel(l);
                            speak(l, data.settings.audioEnabled);
                          }}
                          aria-pressed={sel === l}
                          aria-label={`Huruf ${l}, ${handsOf(l)} tangan${
                            learned.includes(l) ? ", sudah dipelajari" : ""
                          }`}
                          className={`relative flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-ink font-display text-2xl font-bold transition hover:-translate-y-1 ${
                            sel === l ? "bg-ink text-white" : "bg-white"
                          }`}
                        >
                          {l}

                          {learned.includes(l) && (
                            <span
                              aria-hidden="true"
                              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-ink bg-mint text-sm"
                            >
                              <Check className="h-3 w-3" />
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              </Reveal>
            );
          })}

          {/* DYNAMIC VOCABULARY */}
          <Reveal>
            <section className="card relative space-y-4 overflow-hidden bg-grape p-5 text-white">
              <div
                aria-hidden="true"
                className="absolute -right-8 -top-8 h-32 w-32 rounded-full border-4 border-white/10"
              />

              <div className="relative z-10 flex flex-wrap items-center gap-2">
                <span className="rounded-full border-2 border-white/30 bg-white/15 px-3 py-1 text-xs font-bold">
                  ADVANCED PRACTICE
                </span>
                <span className="rounded-full border-2 border-ink bg-mint px-3 py-1 text-xs font-bold text-ink">
                  {learnedWords.length}/{WORD_ITEMS.length} Dipelajari
                </span>
              </div>

              <div className="relative z-10 space-y-2">
                <h2 className="font-display text-xl font-bold">
                  Kosakata BISINDO Dinamis
                </h2>
                <p className="text-sm leading-relaxed text-white/90">
                  Setelah mengenal alfabet, lanjutkan latihan melalui kosakata BISINDO yang melibatkan gerakan tangan. Amati referensi, kemudian praktikkan gerakannya melalui kamera.
                </p>
              </div>

              <div className="relative z-10 space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>Progres pembelajaran</span>
                  <span>{wordProgress}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full border-2 border-white/40 bg-white/20">
                  <div
                    className="h-full rounded-full bg-sun transition-all duration-500"
                    style={{ width: `${wordProgress}%` }}
                  />
                </div>
              </div>

              <div className="relative z-10 flex flex-wrap gap-2.5">
                {WORD_ITEMS.map((w) => {
                  const active =
                    selState.kind === "word" && selState.value === w.id;
                  const isDone = learnedWords.includes(w.id);

                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() =>
                        setSelState({ kind: "word", value: w.id })
                      }
                      aria-pressed={active}
                      className={`min-h-[44px] rounded-xl border-2 border-ink px-3.5 py-2 text-sm font-bold shadow-[3px_3px_0px_#1B1B3A] transition hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px] ${
                        active
                          ? "bg-ink text-white"
                          : isDone
                            ? "bg-mint text-ink"
                            : "bg-white text-ink"
                      }`}
                    >
                      {w.title}
                      {isDone && <Check className="ml-1 inline h-3 w-3" />}
                    </button>
                  );
                })}
              </div>

              <p className="relative z-10 text-xs leading-relaxed text-white/70">
                Pilih kosakata untuk melihat referensi dan memulai latihan
                gerakan.
              </p>
            </section>
          </Reveal>
        </div>

        {/* RIGHT COLUMN: REFERENCE AND CAMERA */}
        <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          {selectedWord ? (
            <>
              <div className="space-y-1">
                <span className="text-xs font-bold tracking-wider text-grape">
                  STEP 01 — LEARN THE SIGN
                </span>
                <h2 className="text-xl font-bold">Kenali Kosakata</h2>
                <p className="text-sm leading-relaxed text-ink/70">
                  Pelajari referensi dan petunjuk gerakan sebelum melakukan praktik melalui kamera.
                </p>
              </div>

              <div
                key={selectedWord.id}
                className="card animate-pop space-y-3 bg-white p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-2xl border-2 border-ink bg-grape px-4 py-2 font-display text-2xl font-bold text-white shadow-[3px_3px_0px_#1B1B3A]">
                      {selectedWord.title}
                    </span>
                    <span className="rounded-full border-2 border-ink bg-mint px-3 py-1 text-sm font-bold text-ink">
                      {selectedWord.hands} Tangan
                    </span>
                    {learnedWords.includes(selectedWord.id) && (
                      <span className="rounded-full border-2 border-ink bg-sun px-3 py-1 text-sm font-bold text-ink">
                        Dikuasai <Check className="inline h-3 w-3" />
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    aria-label={`Dengarkan kata ${selectedWord.title}`}
                    onClick={() =>
                      speak(selectedWord.title, data.settings.audioEnabled)
                    }
                    className="btn min-h-[44px] min-w-[44px] bg-sun px-3 py-2 text-ink"
                  >
                    <Volume2 className="h-5 w-5" />
                  </button>
                </div>

                <p className="text-sm leading-relaxed text-ink">
                  {selectedWord.guide}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold tracking-wider text-grape">
                  STEP 02 — AI PRACTICE
                </span>
                <h2 className="text-xl font-bold">Praktikkan Gerakan</h2>
                <p className="text-sm leading-relaxed text-ink/70">
                  Ikuti gerakan sesuai referensi dan praktikkan melalui pengenalan gestur berbasis AI.
                </p>
              </div>

              <WordCameraSlot word={selectedWord} />
            </>
          ) : (
            <>
              <div className="space-y-1">
                <span className="text-xs font-bold tracking-wider text-grape">
                  STEP 01 — LEARN THE SIGN
                </span>
                <h2 className="text-xl font-bold">Kenali Bentuk Isyarat</h2>
                <p className="text-sm leading-relaxed text-ink/70">
                  Amati referensi visual dan pahami posisi tangan sebelum memulai latihan.
                </p>
              </div>

              {/* LETTER REFERENCE */}
              <div
                key={sel}
                className="card animate-pop flex items-start gap-3 bg-white p-4"
              >
                <img
                  src={`/images/bisindo/${sel}.webp`}
                  alt={`Contoh pose tangan huruf BISINDO ${sel}`}
                  className="h-24 w-24 shrink-0 rounded-2xl border-4 border-ink bg-sun/20 object-cover sm:h-28 sm:w-28"
                />

                <div className="min-w-0 flex-1">
                  {/* Huruf + label tangan + suara */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-4 border-ink bg-grape font-display text-3xl font-bold text-white">
                      {sel}
                    </span>

                    <div className="min-w-0">
                      <h3 className="text-base font-bold">Huruf {sel}</h3>
                      <span className="inline-block rounded-full border-2 border-ink bg-mint px-3 py-1 text-xs font-semibold">
                        {handsOf(sel)} Tangan
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => speak(sel, data.settings.audioEnabled)}
                      className="btn !min-h-[36px] !px-3 bg-sun"
                      aria-label={`Dengarkan huruf ${sel}`}
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Deskripsi */}
                  <p className="mt-2 text-sm leading-snug text-ink/80">
                    Tirukan bentuk tangan pada foto contoh, lalu tahan selama 1,5 detik di kamera.
                  </p>

                  {/* Catatan khusus huruf J */}
                  {sel === "J" && (
                    <p className="mt-2 rounded-xl border-2 border-ink/10 bg-sun p-3 text-sm leading-snug">
                      <strong>Catatan praktik:</strong> Dalam penggunaan sehari-hari,
                      huruf J digerakkan melengkung di udara. Untuk latihan kamera,
                      tahan pose akhir kelingking mengarah ke samping.
                    </p>
                  )}
                </div>
              </div>

              {/* CAMERA PRACTICE */}
              <div className="space-y-1">
                <span className="text-xs font-bold tracking-wider text-grape">
                  STEP 02 — AI PRACTICE
                </span>
                <div className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  <h2 className="text-xl font-bold">
                    Praktikkan Melalui Kamera
                  </h2>
                </div>
                <p className="text-sm leading-relaxed text-ink/70">
                  Tunjukkan isyarat yang sesuai dengan referensi. Pertahankan pose agar sistem AI dapat mengenali gestur tanganmu.
                </p>
              </div>

              <CameraSlot letter={sel} />
            </>
          )}

          {/* LEARNING MESSAGE */}
          <div className="card flex items-start gap-3 bg-mint p-4">
            <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-bold">Terus tingkatkan kemampuanmu!</p>
              <p className="mt-1 text-sm leading-relaxed text-ink/75">
                Setiap huruf dan kosakata yang berhasil dipelajari merupakan langkah awal untuk membangun pemahaman dan komunikasi yang lebih inklusif.
              </p>
            </div>
          </div>

          {/* ENVIRONMENT REMINDER */}
          <div className="card flex items-start gap-3 bg-sky p-4">
            <Shield className="mt-0.5 h-5 w-5 shrink-0 text-grape" />
            <div>
              <p className="font-bold">Inklusivitas untuk semua.</p>
              <p className="mt-1 text-sm leading-relaxed text-ink/75">
                Kepedulian terhadap lingkungan juga berarti memastikan
                informasi dan kesempatan berpartisipasi dapat dijangkau
                masyarakat dengan beragam kebutuhan komunikasi.
              </p>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* LEARNING PROGRESS */}
      <Reveal>
        <section className="card mt-10 bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold tracking-wider text-grape">
                YOUR LEARNING JOURNEY
              </span>
              <h2 className="mt-1 text-2xl font-bold">
                Perjalanan Belajarmu
              </h2>
              <p className="mt-1 text-sm text-ink/70">
                Pantau perkembangan penguasaan alfabet BISINDO.
              </p>
            </div>

            <span className="rounded-full border-2 border-ink bg-mint px-4 py-2 font-bold">
              {letterProgress}% selesai
            </span>
          </div>

          <div className="mt-5 h-4 overflow-hidden rounded-full border-2 border-ink bg-surface-secondary">
            <div
              className="h-full rounded-full bg-grape transition-all duration-500"
              style={{ width: `${letterProgress}%` }}
            />
          </div>

          <div className="mt-2 flex items-center justify-between text-sm font-medium">
            <span>{learnedCount} huruf dipelajari</span>
            <span>{allLetters.length - learnedCount} huruf tersisa</span>
          </div>
        </section>
      </Reveal>

      {/* LOCAL ANIMATIONS */}
      <style jsx>{`
        .nature-sun {
          animation: sun-glow 4s ease-in-out infinite;
        }

        .floating-leaf {
          animation: leaf-float 4s ease-in-out infinite;
          transform-origin: center;
        }

        .leaf-delay {
          animation-delay: 1.2s;
        }

        .cloud {
          animation: cloud-drift 9s ease-in-out infinite alternate;
        }

        .cloud-two {
          animation-delay: 1.5s;
          animation-duration: 12s;
        }

        @keyframes sun-glow {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(255, 201, 60, 0);
          }
          50% {
            box-shadow: 0 0 0 12px rgba(255, 201, 60, 0.22);
          }
        }

        @keyframes leaf-float {
          0%, 100% {
            transform: translateY(0) rotate(-8deg);
          }
          50% {
            transform: translateY(-9px) rotate(12deg);
          }
        }

        @keyframes cloud-drift {
          from {
            transform: translateX(-5px);
          }
          to {
            transform: translateX(12px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .nature-sun,
          .floating-leaf,
          .cloud {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
