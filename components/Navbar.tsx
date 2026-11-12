"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useProgress } from "@/lib/storage/useProgress";

const LINKS = [
  { href: "/", label: "Beranda" },
  { href: "/bisindo", label: "Belajar BISINDO" },
  { href: "/braille", label: "Belajar Braille" },
  { href: "/progress", label: "Progres Saya" },
];

export default function Navbar() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const { data, setAudio } = useProgress();
  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
  const on = data.settings.audioEnabled;
  return (
    <header className="sticky top-0 z-40 border-b-4 border-ink bg-paper/95 backdrop-blur">
      <nav aria-label="Navigasi utama" className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="font-display text-2xl font-bold tracking-tight">
          SIGN<span className="text-grape">IFY</span>
        </Link>
        <ul className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} aria-current={path === l.href ? "page" : undefined} className={`inline-flex min-h-[44px] items-center rounded-full px-4 font-semibold transition hover:bg-sun ${path === l.href ? "bg-ink text-white hover:bg-ink" : ""}`}>{l.label}</Link>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <button onClick={() => setAudio(!on)} aria-pressed={on} aria-label={on ? "Matikan suara" : "Nyalakan suara"} className="btn !min-h-[44px] !px-4 bg-white text-xl shadow-popsm">
            <span aria-hidden="true">{on ? "🔊" : "🔇"}</span>
          </button>
          <button onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="menu-mobile" aria-label="Buka menu" className="btn !min-h-[44px] !px-4 bg-sun md:hidden">
            <span aria-hidden="true">{open ? "✕" : "☰"}</span>
          </button>
        </div>
      </nav>
      {open && (
        <ul id="menu-mobile" className="animate-pagein grid gap-2 border-t-4 border-ink bg-white p-4 md:hidden">
          {LINKS.map((l) => (
            <li key={l.href}><Link href={l.href} className="flex min-h-[48px] items-center rounded-2xl bg-paper px-4 font-display text-lg font-semibold">{l.label}</Link></li>
          ))}
        </ul>
      )}
    </header>
  );
}
