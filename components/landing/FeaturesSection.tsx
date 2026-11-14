
"use client";

import { useState } from "react";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import styles from "./FeatureShowcase.module.css";
import { ArrowUpRight, ChevronRight } from "react-feather";

const FEATURES = [
  {
    id: "bisindo",
    number: "01",
    title: "BISINDO AI Recognition",
    subtitle: "Belajar bahasa isyarat",
    tagline:
      "Mengenal komunikasi yang lebih inklusif, satu gerakan pada satu waktu.",
    description:
      "Latih kemampuan mengenali alfabet BISINDO melalui kamera. Sistem mendeteksi posisi tangan dan membantu mengenali gestur untuk 26 huruf alfabet. Kemampuan komunikasi yang lebih inklusif dapat membuka ruang partisipasi dan pertukaran pengetahuan bagi masyarakat dengan kebutuhan komunikasi yang beragam.",
    points: [
      "Deteksi gestur tangan",
      "Pengenalan 1 dan 2 tangan",
      "Latihan alfabet A–Z",
    ],
    href: "/bisindo",
    action: "Mulai belajar",
  },
  {
    id: "braille",
    number: "02",
    title: "Braille Simulator",
    subtitle: "Kenali pola enam titik",
    tagline:
      "Membuka akses belajar melalui pengenalan sistem tulisan Braille.",
    description:
      "Pelajari cara membaca dan membentuk huruf Braille melalui sel enam titik interaktif. Coba klik titik atau gunakan keyboard untuk membentuk pola. Pengenalan Braille menjadi langkah awal memahami pentingnya akses informasi bagi penyandang Tunanetra.",
    points: [
      "Pengenalan enam titik",
      "Simulasi pola huruf",
      "Latihan input keyboard",
    ],
    href: "/braille",
    action: "Coba simulator",
  },
  {
    id: "guess",
    number: "03",
    title: "Guess the Sign",
    subtitle: "Uji pemahamanmu",
    tagline:
      "Latihan interaktif untuk membangun pemahaman komunikasi inklusif.",
    description:
      "Uji pengetahuan alfabet BISINDO dengan menebak huruf berdasarkan gestur yang ditampilkan. Melalui latihan yang menyenangkan, pengguna dapat memperkuat pemahaman dasar komunikasi inklusif dan membangun kesadaran untuk berinteraksi dengan lebih terbuka.",
    points: [
      "Tebak huruf BISINDO",
      "Latihan pengenalan gestur",
      "Evaluasi jawaban",
    ],
    href: "/bisindo",
    action: "Coba latihan",
  },
  {
    id: "progress",
    number: "04",
    title: "Learning Progress",
    subtitle: "Pantau perjalanan belajar",
    tagline:
      "Setiap kemajuan kecil berarti dalam perjalanan menuju masyarakat inklusif.",
    description:
      "Lihat perkembangan belajarmu melalui XP, streak harian, dan catatan huruf yang sudah dipelajari. Progres ini membantu pengguna memantau konsistensi belajar dalam mengenal BISINDO dan Braille sebagai bagian dari penguatan literasi dan akses pengetahuan.",
    points: [
      "Perolehan XP",
      "Streak belajar",
      "Riwayat penguasaan huruf",
    ],
    href: "/progress",
    action: "Lihat progres",
  },
  {
    id: "eco",
    number: "05",
    title: "Inclusive Eco-Learning",
    subtitle: "Belajar lingkungan secara inklusif",
    tagline:
      "Mengenal keberlanjutan melalui akses pengetahuan yang lebih inklusif.",
    description:
      "Jelajahi materi singkat mengenai ekosistem mangrove, kebersihan laut, dan keanekaragaman hayati hutan tropis. Kenali istilah penting dari setiap topik, kemudian eksplorasi huruf-huruf penyusunnya melalui modul pembelajaran alfabet BISINDO.",
    points: [
      "Materi lingkungan tematik",
      "Kosakata lingkungan",
      "Eksplorasi alfabet BISINDO",
    ],
    href: "/bisindo",
    action: "Latih alfabet",
  },

] as const;

type FeatureId = (typeof FEATURES)[number]["id"];


const ECO_TOPICS = [
  {
    id: "mangrove",
    icon: "🌱",
    title: "Mangrove",
    category: "EKOSISTEM PESISIR",
    description:
      "Mangrove melindungi pantai, menjadi habitat organisme, dan menjaga keseimbangan lingkungan.",
    keyword: "PESISIR",
    letters: ["P", "E", "S", "I", "S", "I", "R"],
    color: "bg-mint",
  },
  {
    id: "ocean",
    icon: "🌊",
    title: "Laut Bersih",
    category: "KELESTARIAN LAUT",
    description:
      "Sampah laut mengancam biota dan merusak ekosistem, sehingga perlu dikurangi dan dikelola dengan baik.",
    keyword: "LAUT",
    letters: ["L", "A", "U", "T"],
    color: "bg-sky",
  },
  {
    id: "forest",
    icon: "🌳",
    title: "Hutan Tropis",
    category: "KEANEKARAGAMAN HAYATI",
    description:
      "Hutan tropis menjadi habitat beragam flora dan fauna serta menjaga keseimbangan ekosistem.",
    keyword: "HUTAN",
    letters: ["H", "U", "T", "A", "N"],
    color: "bg-sun",
  },
] as const;

function EcoLearningDemo() {
  const [activeTopic, setActiveTopic] = useState(0);
  const topic = ECO_TOPICS[activeTopic];

  return (
    <div className={styles.demoStage}>
      <div className="w-full max-w-[330px] rounded-3xl border-4 border-ink bg-white p-4 text-ink shadow-pop sm:p-5">

        {/* HEADER */}
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-black tracking-[0.15em] text-gray-500">
              SIGNIFY LEARNING LIBRARY
            </span>
            <h4 className="mt-1 text-xl font-black">
              Eco-Learning
            </h4>
          </div>

          <span className="rounded-full border-2 border-ink bg-mint px-3 py-1 text-[10px] font-black">
            EXPLORE
          </span>
        </div>

        {/* TOPIC SELECTOR */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          {ECO_TOPICS.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTopic(index)}
              aria-pressed={activeTopic === index}
              className={`rounded-xl border-2 border-ink p-2 text-center transition-all duration-200 ${
                activeTopic === index
                  ? `${item.color} -translate-y-1 shadow-popsm`
                  : "bg-white hover:bg-gray-100"
              }`}
            >
              <span className="block text-2xl">{item.icon}</span>
              <span className="mt-1 block text-[10px] font-black">
                {item.title}
              </span>
            </button>
          ))}
        </div>

        {/* SELECTED TOPIC */}
        <div
          key={topic.id}
          className="mt-4 animate-in fade-in duration-300"
        >
          <div className={`rounded-2xl border-2 border-ink px-4 py-1 mb-1 ${topic.color}`}>
            <span className="text-[10px] font-black tracking-wider">
              {topic.category}
            </span>

            <h5 className="mt-1 text-2xl font-black">
              {topic.icon} {topic.title}
            </h5>

            <p className="mt-2 text-xs leading-snug mb-1">
              {topic.description}
            </p>
          </div>

          {/* KEYWORD */}
          <div className="">
            <span className="text-[10px] font-black tracking-wider text-gray-500">
              KOSAKATA UTAMA
            </span>

            <h5 className="text-lg font-black">
              {topic.keyword}
            </h5>

            <div className="flex flex-wrap gap-1.5">
              {topic.letters.map((letter, index) => (
                <span
                  key={`${letter}-${index}`}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-ink bg-sun text-sm font-black shadow-popsm"
                >
                  {letter}
                </span>
              ))}
            </div>
          </div>

          <p className="mt-4 border-t-2 border-dashed border-gray-300 pt-3 text-[10px] font-medium leading-snug text-gray-600">
            Kenali huruf penyusun kosakata, lalu lanjutkan
            eksplorasi alfabet melalui modul BISINDO.
          </p>
        </div>
      </div>

      <p className={styles.demoCaption}>
        Demonstrasi pembelajaran lingkungan dan eksplorasi alfabet
      </p>
    </div>
  );
}

function FeatureAnimation({ type }: { type: FeatureId }) {
  if (type === "bisindo") {
    return (
      <div className={styles.demoStage}>
        <div className={styles.cameraFrame}>
          <div className={styles.cameraTop}>
            <span>CAMERA SIMULATION</span>
            <span className={styles.liveDot}>● LIVE</span>
          </div>

          <div className={styles.handScene}>
            <div className={styles.hand}>✋</div>

            {Array.from({ length: 8 }).map((_, i) => (
              <span
                key={i}
                className={`${styles.landmark} ${styles[`point${i + 1}`]}`}
              />
            ))}

            <div className={styles.scanLine} />
          </div>

          <div className={styles.recognition}>
            <span>GESTURE DETECTED</span>
            <strong>A</strong>
            <span className={styles.confidence}>AI Recognition Preview</span>
          </div>
        </div>
        <p className={styles.demoCaption}>
          Simulasi proses pengenalan gestur tangan
        </p>
      </div>
    );
  }

  if (type === "braille") {
    return (
      <div className={styles.demoStage}>
        <div className={styles.brailleDemo}>
          <div className={styles.demoLabel}>BRAILLE CELL SIMULATION</div>

          <div className={styles.brailleCell}>
            {[true, true, true, false, true, false].map((active, i) => (
              <span
                key={i}
                className={`${styles.brailleDot} ${
                  active ? styles.activeDot : ""
                }`}
                style={{ animationDelay: `${i * 0.16}s` }}
              />
            ))}
          </div>

          <div className={styles.brailleResult}>
            <span>LETTER PREVIEW</span>
            <strong>R</strong>
          </div>

          <div className={styles.keyboardDemo}>
            {["F", "D", "S", "J", "K", "L"].map((key, i) => (
              <span
                key={key}
                className={styles.key}
                style={{ animationDelay: `${i * 0.2}s` }}
              >
                {key}
              </span>
            ))}
          </div>
        </div>
        <p className={styles.demoCaption}>
          Simulasi pembentukan pola Braille enam titik
        </p>
      </div>
    );
  }

  if (type === "guess") {
    return (
      <div className={styles.demoStage}>
        <div className={styles.quizDemo}>
          <div className={styles.demoLabel}>GUESS THE SIGN</div>

          <div className={styles.quizQuestion}>
            <span>Which letter is this?</span>
            <div className={styles.quizHand}>🤟</div>
          </div>

          <div className={styles.quizOptions}>
            {["A", "B", "C", "D"].map((letter, i) => (
              <span
                key={letter}
                className={`${styles.quizOption} ${
                  i === 2 ? styles.correctOption : ""
                }`}
                style={{ animationDelay: `${i * 0.25}s` }}
              >
                {letter}
              </span>
            ))}
          </div>

          <div className={styles.quizFeedback}>
            <span>✓</span> Great job! Keep learning.
          </div>
        </div>
        <p className={styles.demoCaption}>
          Simulasi latihan menebak huruf BISINDO
        </p>
      </div>
    );
  }

  if (type === "eco") {
    return <EcoLearningDemo />;
  }


  return (
    <div className={styles.demoStage}>
      <div className={styles.progressDemo}>
        <div className={styles.demoLabel}>YOUR LEARNING JOURNEY</div>

        <div className={styles.progressStats}>
          <div>
            <span>TOTAL XP</span>
            <strong>250 ✦</strong>
          </div>
          <div>
            <span>STREAK</span>
            <strong>5 🔥</strong>
          </div>
        </div>

        <div className={styles.chart}>
          {[35, 65, 45, 85, 55, 100, 70].map((height, i) => (
            <div className={styles.chartColumn} key={i}>
              <div
                className={styles.chartBar}
                style={{
                  height: `${height}%`,
                  animationDelay: `${i * 0.12}s`,
                }}
              />
              <span>{["S", "S", "R", "K", "J", "S", "M"][i]}</span>
            </div>
          ))}
        </div>

        <div className={styles.progressTrack}>
          <div className={styles.progressFill} />
        </div>
        <span className={styles.progressCaption}>
          Keep going! You're making progress.
        </span>
      </div>
      <p className={styles.demoCaption}>
        Ilustrasi perjalanan dan perkembangan belajar
      </p>
    </div>
  );
}

export default function FeaturesSection() {
  const [active, setActive] = useState<FeatureId>("bisindo");

  const selected = FEATURES.find((feature) => feature.id === active)!;

  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <Reveal>
        <div className="mb-12">
          <span className="inline-block rounded-full border-2 border-ink bg-mint px-4 py-2 text-sm font-bold">
            EXPLORE SIGNIFY
          </span>

          <h2 className="mt-5 text-4xl font-bold leading-tight sm:text-5xl">
            Satu platform, <br/> lebih banyak cara untuk belajar dan memahami.
          </h2>

          <p className="mt-4 text-lg leading-snug">
            Kenali fitur pembelajaran BISINDO dan Braille yang dirancang
            untuk memperkenalkan komunikasi inklusif. Melalui akses belajar
            yang lebih terbuka, SIGNIFY turut mengangkat pentingnya
            pemerataan pengetahuan bagi masyarakat.
          </p>
        </div>
      </Reveal>

      <Reveal delay={100}>
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.5fr] lg:items-stretch">

          {/* ACCORDION FEATURE LIST */}
          <div
            className="flex flex-col gap-3"
            aria-label="Daftar fitur SIGNIFY"
          >
            {FEATURES.map((feature) => {
              const isActive = active === feature.id;

              return (
                <div
                  key={feature.id}
                  className={`overflow-hidden rounded-2xl border-4 border-ink transition-all duration-300 ${
                    isActive
                      ? "bg-sun shadow-popsm"
                      : "bg-white hover:bg-sun/30"
                  }`}
                  onMouseEnter={() => setActive(feature.id)}
                >
                  <button
                    type="button"
                    onFocus={() => setActive(feature.id)}
                    onClick={() => setActive(feature.id)}
                    aria-expanded={isActive}
                    className="flex w-full items-center gap-4 p-5 text-left"
                  >
                    <span
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-ink font-display text-lg font-bold transition-colors ${
                        isActive ? "bg-white" : "bg-mint"
                      }`}
                    >
                      {feature.number}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block text-lg font-bold">
                        {feature.title}
                      </span>
                    </span>

                    <span
                      className={`text-2xl transition-transform duration-300 ${
                        isActive ? "rotate-90" : ""
                      }`}
                      aria-hidden="true"
                    >
                      <ArrowUpRight className="h-5 w-5" />
                    </span>
                  </button>

                  {/* EXPANDED DESCRIPTION */}
                  <div
                    className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                      isActive
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    }`}
                    aria-hidden={!isActive}
                  >
                    <div className="overflow-hidden">
                      <div className="px-5 pb-5 pl-[76px]">
                        <p className="text-sm leading-snug">
                          {feature.tagline}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ANIMATED DEMONSTRATION PANEL */}
          <div className="relative flex min-h-[440px] overflow-hidden rounded-3xl border-4 border-ink bg-grape p-6 text-white shadow-popsm sm:p-8">
            <div
              key={selected.id}
              className={`${styles.detailContent} flex w-full flex-col`}
            >
              <div className="flex h-full flex-1 flex-col justify-between gap-5 md:flex-row md:items-center">
                <div className="flex flex-col justify-center">
                  <span className="inline-block w-fit rounded-full border-2 border-white/70 px-3 py-1 text-xs font-bold">
                    FEATURE {selected.number}
                  </span>

                  <h3 className="mt-5 text-3xl font-bold leading-tight">
                    {selected.title}
                  </h3>

                  <p className="mt-4 text-sm max-w-sm leading-snug text-white/85">
                    {selected.description}
                  </p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {selected.points.map((point) => (
                        <span
                        key={point}
                        className="inline-flex items-center rounded-full border-2 border-ink bg-white px-3 py-1.5 text-xs font-bold text-ink shadow-popsm"
                        >
                        {point}
                        </span>
                    ))}
                  </div>

                  <Link
                    href={selected.href}
                    className="btn mt-7 inline-flex w-fit bg-sun text-ink"
                  >
                    {selected.action} <ChevronRight className="ml-1 h-5 w-5" />
                  </Link>
                </div>

                <div className="flex shrink-0 items-center justify-center">
                  <FeatureAnimation type={selected.id} />
                </div>
              </div>
            </div>
          </div>

        </div>
      </Reveal>
    </section>
  );
}