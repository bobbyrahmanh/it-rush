"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LogIn, LogOut, Menu, Volume2, VolumeX, X, Zap } from "react-feather";
import UserAvatar from "@/components/UserAvatar";
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
  const { data, setAudio, logout } = useProgress();

  useEffect(() => {
    setOpen(false);
  }, [path]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const on = data.settings.audioEnabled;
  const isAuthenticated = data.auth.mode === "authenticated" && Boolean(data.auth.user);
  const shortName = data.auth.user?.displayName.split(" ")[0] ?? "Akun";
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 80);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-1/2 z-40 -translate-x-1/2 border-b-4 border-ink bg-paper/95 backdrop-blur transition-all duration-300 ease-in-out
      ${scrolled
        ? "w-full md:w-[75%] md:rounded-2xl md:top-3"
        : "w-full md:rounded-2xl" }`}>
      <nav
        aria-label="Navigasi utama"
        className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3"
      >
        <Link href="/" className="font-display text-2xl font-bold tracking-tight">
          SIGN<span className="text-grape">IFY</span>
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={path === l.href ? "page" : undefined}
                className={`inline-flex min-h-[44px] items-center rounded-full px-4 font-semibold transition hover:bg-sun ${
                  path === l.href ? "bg-ink text-white hover:bg-ink" : ""
                }`}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAudio(!on)}
            aria-pressed={on}
            aria-label={on ? "Matikan suara panduan" : "Nyalakan suara panduan"}
            className="btn !min-h-[44px] !px-3.5 bg-white text-ink shadow-popsm"
          >
            {on ? (
              <Volume2 className="h-5 w-5" aria-hidden="true" />
            ) : (
              <VolumeX className="h-5 w-5" aria-hidden="true" />
            )}
          </button>

          {isAuthenticated ? (
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                href="/progress"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full border-2 border-ink bg-mint px-2.5 py-1 text-sm font-bold text-ink transition hover:-translate-y-0.5"
              >
                <UserAvatar
                  avatarId={data.auth.user?.avatarId || data.settings.avatarId}
                  size="xs"
                  className="!border-0 !shadow-none"
                />
                <span>{shortName}</span>
                <span className="inline-flex items-center gap-1 rounded-full border border-ink bg-sun px-2 py-0.5 text-xs">
                  <Zap className="h-3 w-3" aria-hidden="true" />
                  {data.streak.current}h
                </span>
              </Link>
              <button
                type="button"
                onClick={() => void logout()}
                aria-label="Keluar ke Mode Tamu"
                className="btn !min-h-[44px] !px-3.5 bg-white text-sm text-ink shadow-popsm"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span className="hidden lg:inline">Keluar</span>
              </button>
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <span className="inline-flex min-h-[44px] items-center gap-2 rounded-full border-2 border-ink bg-mint px-2.5 py-1 text-sm font-bold text-ink transition hover:-translate-y-0.5 cursor-pointer">
                Mode Tamu
              </span>
              <Link
                href="/login"
                className={`btn !min-h-[44px] !px-4 text-sm shadow-popsm ${
                  path === "/login" ? "bg-ink text-white" : "bg-sun text-ink"
                }`}
              >
                <LogIn className="h-4 w-4" aria-hidden="true" />
                <span>Masuk</span>
              </Link>
            </div>
          )}

          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label={open ? "Tutup menu navigasi" : "Buka menu navigasi"}
            className="btn !min-h-[44px] !px-3.5 bg-sun text-sm text-ink md:hidden"
          >
            {open ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
            <span>Menu</span>
          </button>
        </div>
      </nav>

      {open && (
        <div
          id="menu-mobile"
          className="animate-pagein space-y-3 border-t-4 border-ink bg-white p-4 md:hidden max-h-[calc(100svh-70px)] overflow-y-auto"
        >
          <ul className="grid gap-2">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={`flex min-h-[48px] items-center rounded-2xl border-2 border-ink px-4 font-display text-lg font-semibold ${
                    path === l.href ? "bg-ink text-white" : "bg-paper text-ink"
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="rounded-2xl border-2 border-ink bg-paper p-3">
            {isAuthenticated && data.auth.user ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <UserAvatar
                    avatarId={data.auth.user.avatarId || data.settings.avatarId}
                    size="sm"
                  />
                  <div>
                    <p className="text-xs font-semibold text-ink/75">Masuk sebagai</p>
                    <p className="font-display text-base font-bold text-ink">
                      {data.auth.user.displayName}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="btn !min-h-[44px] w-full sm:w-auto justify-center bg-white !px-4 text-sm text-ink"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Keluar
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase text-ink/75">Status Saat Ini</p>
                  <p className="font-display text-base font-bold text-ink">
                    Mode Tamu (Tanpa Akun)
                  </p>
                </div>
                <Link
                  href="/login"
                  className="btn !min-h-[44px] w-full sm:w-auto justify-center bg-sun !px-4 text-sm text-ink"
                >
                  <LogIn className="h-4 w-4" aria-hidden="true" />
                  Masuk / Daftar
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
