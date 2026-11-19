"use client";
import { useEffect, useState } from "react";
import Mascot from "./Mascot";

export default function Loader() {
  const [phase, setPhase] = useState<"show" | "leave" | "gone">("show");
  useEffect(() => {
    const a = setTimeout(() => setPhase("leave"), 1000);
    const b = setTimeout(() => setPhase("gone"), 1500);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, []);
  if (phase === "gone") return null;
  const colors = ["bg-coral", "bg-sun", "bg-mint", "bg-grape"];
  return (
    <div role="status" aria-live="polite" className={`fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 sm:gap-6 bg-paper px-4 text-center transition-opacity duration-500 ${phase === "leave" ? "opacity-0" : "opacity-100"}`}>
      <Mascot className="h-32 w-32 sm:h-44 sm:w-44" />
      <div className="flex gap-2.5 sm:gap-3" aria-hidden="true">
        {colors.map((c, i) => <span key={c} className={`h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-full border-2 border-ink ${c} animate-bounceDot`} style={{ animationDelay: `${i * 0.12}s` }} />)}
      </div>
      <p className="font-display text-lg sm:text-xl font-semibold">Menyiapkan ruang belajar</p>
    </div>
  );
}
