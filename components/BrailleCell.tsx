"use client";
import { DOT_KEYS } from "@/lib/braille";

export default function BrailleCell({
  dots,
  onToggle,
  disabled = false,
}: {
  dots: boolean[];
  onToggle: (i: number) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className="grid w-fit grid-cols-2 gap-x-6 gap-y-3 rounded-3xl border-4 border-ink bg-sky p-5"
      role="group"
      aria-label="Sel Braille enam titik"
    >
      {[0, 3, 1, 4, 2, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onToggle(i)}
          disabled={disabled}
          aria-pressed={dots[i]}
          aria-label={`Titik ${i + 1}, tombol ${DOT_KEYS[i]}`}
          className={`flex h-16 w-16 flex-col items-center justify-center rounded-full border-4 border-ink font-display transition duration-200 active:scale-90 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-grape sm:h-20 sm:w-20 ${
            dots[i]
              ? "animate-pop scale-105 bg-grape text-white shadow-popsm"
              : "bg-white text-ink hover:-translate-y-1"
          } disabled:cursor-default disabled:hover:translate-y-0 disabled:active:scale-100`}
        >
          <span className="text-xl font-bold">{i + 1}</span>
          <span className="text-xs font-semibold">[{DOT_KEYS[i]}]</span>
        </button>
      ))}
    </div>
  );
}

