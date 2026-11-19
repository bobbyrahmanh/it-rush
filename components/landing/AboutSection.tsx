
"use client";

import { useState } from "react";
import Reveal from "@/components/Reveal";
import { BookOpen, Users, ArrowRight, RotateCcw } from "react-feather";

const CARDS = [
  {
    id: "bisindo",
    number: "01",
    label: "BISINDO",
    title: "Kenali bahasa isyarat.",
    description: "Pelajari alfabet BISINDO melalui pengenalan gestur tangan.",
    detail:
      "SIGNIFY menghadirkan pembelajaran alfabet BISINDO A–Z dengan bantuan teknologi pengenalan gestur tangan. Pengguna dapat berlatih mengenali bentuk isyarat secara interaktif melalui kamera maupun video simulasi.",
    color: "bg-sun",
    icon: BookOpen,
    symbol: "A B C",
  },
  {
    id: "braille",
    number: "02",
    label: "BRAILLE",
    title: "Pahami pola titik.",
    description: "Eksplorasi huruf Braille melalui simulasi interaktif.",
    detail:
      "Melalui simulator Braille, pengguna dapat mengenal susunan enam titik yang membentuk huruf. Setiap titik dapat dieksplorasi secara interaktif untuk membantu pengguna memahami pola alfabet Braille.",
    color: "bg-mint",
    icon: BookOpen,
    symbol: "⠁ ⠃ ⠉",
  },
  {
    id: "inclusion",
    number: "03",
    label: "INCLUSION",
    title: "Bangun pemahaman.",
    description: "Mulai mengenal cara berkomunikasi yang lebih inklusif.",
    detail:
      "SIGNIFY ingin mendorong lebih banyak orang untuk mengenal keberagaman cara berkomunikasi. Pemahaman merupakan langkah awal untuk membangun lingkungan sosial yang lebih inklusif dan memberikan ruang bagi setiap orang untuk berpartisipasi.",
    color: "bg-coral",
    icon: Users,
    symbol: "LEARN • SHARE",
  },
];

export default function AboutSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const nextCard = () => {
    setActiveIndex((current) => (current + 1) % CARDS.length);
    setIsFlipped(false);
  };

  const previousCard = () => {
    setActiveIndex(
      (current) => (current - 1 + CARDS.length) % CARDS.length
    );
    setIsFlipped(false);
  };

  const resetDeck = () => {
    setActiveIndex(0);
    setIsFlipped(false);
  };

  return (
    <section className="overflow-hidden border-y-2 sm:border-y-4 border-ink bg-grape py-10 sm:py-20 text-white">
      <Reveal className="mx-auto max-w-6xl px-4">
        <div className="grid gap-8 sm:gap-14 md:grid-cols-[1.1fr_0.9fr] md:items-center">

          {/* ABOUT CONTENT */}
          <div>
            <span className="inline-block rounded-full border-2 border-white/70 px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold">
              ABOUT SIGNIFY
            </span>

            <h2 className="mt-3 sm:mt-6 max-w-3xl text-2xl font-bold leading-tight sm:text-4xl md:text-5xl">
              Setiap orang punya cara belajar dan berkomunikasi.
            </h2>

            <p className="mt-3 sm:mt-6 max-w-2xl text-sm leading-relaxed sm:text-lg sm:leading-snug text-white/90">
              Perbedaan cara berkomunikasi seharusnya tidak menjadi
              penghalang untuk saling memahami. Membangun masyarakat
              yang inklusif dimulai dari kesediaan untuk mengenal dan
              memahami keberagaman tersebut.
            </p>

            <p className="mt-2.5 sm:mt-4 max-w-2xl text-sm leading-relaxed sm:text-lg sm:leading-snug text-white/90">
              SIGNIFY hadir sebagai platform pembelajaran interaktif
              yang mengajak masyarakat mengenal alfabet BISINDO dan
              pola Braille melalui teknologi. Sebuah langkah sederhana
              untuk menumbuhkan pemahaman tentang komunikasi inklusif.
            </p>

            <div className="mt-5 sm:mt-8 flex flex-wrap gap-2 sm:gap-3">
              {["Learn", "Understand", "Include"].map((item) => (
                <span
                  key={item}
                  className="rounded-full border-2 border-white/60 px-3.5 sm:px-5 py-1 sm:py-2 text-xs sm:text-sm font-bold"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* INTERACTIVE FLIP CARD DECK */}
          <div className="flex flex-col items-center">
            <div className="mb-5 sm:mb-8 text-center">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-white/70">
                Explore SIGNIFY
              </span>
              <h3 className="mt-1 sm:mt-2 text-xl sm:text-2xl font-bold">
                Discover what's inside!
              </h3>
              <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-white/75">
                Klik kartu untuk membalik dan membaca ceritanya.
              </p>
            </div>

            {/* CARD STACK */}
            <div className="relative h-[330px] sm:h-[370px] w-full max-w-[280px] sm:max-w-[310px] [perspective:1200px]">
              {CARDS.map((card, index) => {
                const position =
                  (index - activeIndex + CARDS.length) % CARDS.length;

                const isActive = position === 0;
                const isSecond = position === 1;
                const Icon = card.icon;

                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => {
                      if (isActive) {
                        setIsFlipped((current) => !current);
                      } else {
                        setActiveIndex(index);
                        setIsFlipped(false);
                      }
                    }}
                    aria-label={
                      isActive
                        ? `${isFlipped ? "Tampilkan depan" : "Balik kartu"} ${card.label}`
                        : `Pilih kartu ${card.label}`
                    }
                    aria-pressed={isActive && isFlipped}
                    className={`
                      absolute inset-0 w-full text-left
                      transition-all duration-500 ease-in-out
                      ${
                        isActive
                          ? "z-30 translate-x-0 translate-y-0 rotate-0 scale-100 cursor-pointer"
                          : isSecond
                            ? "z-20 translate-x-3 sm:translate-x-5 translate-y-2 sm:translate-y-3 rotate-6 scale-[0.94] cursor-pointer"
                            : "z-10 -translate-x-3 sm:-translate-x-5 translate-y-3 sm:translate-y-5 -rotate-6 scale-[0.88] cursor-pointer"
                      }
                    `}
                    style={{
                      pointerEvents: isActive ? "auto" : "none",
                    }}
                  >
                    {/* FLIP INNER */}
                    <div
                      className={`
                        relative h-full w-full
                        transition-transform duration-700
                        [transform-style:preserve-3d]
                        ${
                          isActive && isFlipped
                            ? "[transform:rotateY(180deg)]"
                            : "[transform:rotateY(0deg)]"
                        }
                      `}
                    >
                      {/* FRONT FACE */}
                      <div
                        className={`
                          absolute inset-0 flex h-full flex-col
                          rounded-2xl sm:rounded-3xl border-2 sm:border-4 border-ink p-4 sm:p-6
                          text-ink shadow-pop
                          [backface-visibility:hidden]
                          ${card.color}
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <span className="rounded-full border-2 border-ink px-2.5 sm:px-3 py-0.5 sm:py-1 text-[11px] sm:text-xs font-black tracking-wider">
                            {card.label}
                          </span>
                          <span className="font-display text-xl sm:text-2xl font-black">
                            {card.number}
                          </span>
                        </div>

                        <div className="my-4 sm:my-7 flex items-center justify-center">
                          <div className="flex h-16 w-16 sm:h-24 sm:w-24 items-center justify-center rounded-2xl sm:rounded-3xl border-2 sm:border-4 border-ink bg-white shadow-popsm">
                            <Icon size={28} className="sm:h-9 sm:w-9" strokeWidth={2.2} />
                          </div>
                        </div>

                        <h4 className="text-xl sm:text-3xl font-black leading-tight">
                          {card.title}
                        </h4>

                        <p className="mt-2 sm:mt-3 text-xs sm:text-sm font-medium leading-snug">
                          {card.description}
                        </p>
                      </div>

                      {/* BACK FACE */}
                      <div
                        className={`
                          absolute inset-0 flex h-full flex-col
                          rounded-2xl sm:rounded-3xl border-2 sm:border-4 border-ink p-4 sm:p-6
                          text-ink shadow-pop
                          [backface-visibility:hidden]
                          [transform:rotateY(180deg)]
                          ${card.color}
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <span className="rounded-full border-2 border-ink px-2.5 sm:px-3 py-0.5 sm:py-1 text-[11px] sm:text-xs font-black tracking-wider">
                            {card.label}
                          </span>
                          <span className="font-display text-xl sm:text-2xl font-black">
                            {card.number}
                          </span>
                        </div>

                        <div className="mt-4 sm:mt-7">
                          <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] opacity-60">
                            Inside SIGNIFY
                          </p>

                          <h4 className="mt-1.5 sm:mt-3 text-lg sm:text-2xl font-black leading-tight">
                            {card.title}
                          </h4>

                          <p className="mt-1.5 sm:mt-2 mb-2 text-xs sm:text-sm font-medium leading-snug">
                            {card.detail}
                          </p>
                        </div>

                        <div className="mt-auto flex items-center justify-between border-t-2 border-ink/30 pt-1">
                          <span className="text-xs sm:text-sm font-black">
                            {card.symbol}
                          </span>
                          <span className="text-[10px] sm:text-xs font-black tracking-wider">
                            SIGNIFY
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* CONTROLS */}
            <div className="mt-5 sm:mt-7 flex items-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={previousCard}
                aria-label="Kartu sebelumnya"
                className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full border-2 border-white bg-white text-ink transition hover:-translate-y-1 hover:bg-sun"
              >
                <ArrowRight className="rotate-180" size={18} />
              </button>

              <div className="flex gap-1.5 sm:gap-2">
                {CARDS.map((card, index) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => {
                      setActiveIndex(index);
                      setIsFlipped(false);
                    }}
                    aria-label={`Pilih kartu ${card.label}`}
                    aria-current={activeIndex === index ? "step" : undefined}
                    className={`h-2.5 sm:h-3 rounded-full border border-white transition-all duration-300 ${
                      activeIndex === index
                        ? "w-6 sm:w-8 bg-sun"
                        : "w-2.5 sm:w-3 bg-white/40 hover:bg-white"
                    }`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={nextCard}
                aria-label="Kartu berikutnya"
                className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full border-2 border-white bg-white text-ink transition hover:-translate-y-1 hover:bg-sun"
              >
                <ArrowRight size={18} />
              </button>
            </div>

            <button
              type="button"
              onClick={resetDeck}
              className="mt-3 sm:mt-4 flex items-center gap-1.5 sm:gap-2 text-xs font-bold text-white/75 transition hover:text-white"
            >
              <RotateCcw size={13} />
              Reset deck
            </button>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
