"use client";
import { DOT_KEYS } from "@/lib/braille";

export default function BrailleCell({ dots, onToggle }: { dots: boolean[]; onToggle: (i: number) => void }) {
  const order = [0, 3, 1, 4, 2, 5]; // baris demi baris: (1,4) (2,5) (3,6)
  return (
    <div className="grid w-fit grid-cols-2 gap-x-8 gap-y-5 rounded-[2rem] border-4 border-ink bg-sky p-6" role="group" aria-label="Sel Braille 6 titik">
      {order.map((i) => (
        <button key={i} type="button" onClick={() => onToggle(i)} aria-pressed={dots[i]} aria-label={`Titik ${i + 1}, tombol ${DOT_KEYS[i]}`}
          className={`flex h-20 w-20 flex-col items-center justify-center rounded-full border-4 border-ink font-display transition active:scale-90 sm:h-24 sm:w-24 ${dots[i] ? "animate-pop bg-grape text-white shadow-popsm" : "bg-white text-ink"}`}>
          <span className="text-2xl font-bold">{i + 1}</span>
          <span className="text-sm font-semibold">[{DOT_KEYS[i]}]</span>
        </button>
      ))}
    </div>
  );
}
