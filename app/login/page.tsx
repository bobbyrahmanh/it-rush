"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  AlertCircle,
  Award,
  CheckCircle,
  Eye,
  EyeOff,
  Lock,
  LogIn,
  Shield,
  UserCheck,
  UserPlus,
  Users,
  Zap,
} from "react-feather";
import {
  AuthMascot,
  type AuthMascotPose,
  type TypingGazeTarget,
} from "@/components/Mascot";
import { useProgress } from "@/lib/storage/useProgress";

type AuthTab = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const {
    data,
    loginWithEmail,
    registerWithEmail,
    loginAsJudgeDemo,
  } = useProgress();

  const [tab, setTab] = useState<AuthTab>("login");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [typingTarget, setTypingTarget] = useState<TypingGazeTarget | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const isAuthenticated =
    data.auth.mode === "authenticated" && Boolean(data.auth.user);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/progress");
    }
  }, [isAuthenticated, router]);

  const mascotPose: AuthMascotPose = showPassword
    ? "peeking"
    : isPasswordFocused
      ? "covering"
      : "idle";

  function updateTypingGaze(
    field: "name" | "email" | "password",
    el: HTMLInputElement
  ) {
    const charIndex = el.selectionStart ?? el.value.length;
    setTypingTarget({ charIndex, field, seq: Date.now() });
  }

  const guestLearnedCount =
    data.bisindo.learnedLetters.length +
    (data.bisindo.learnedWords ?? []).length +
    data.braille.learnedLetters.length;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);
    setSubmitting(true);

    try {
      if (tab === "login") {
        const res = await loginWithEmail(email, password);
        if (!res.ok) {
          setErrorMessage(res.error ?? "Gagal masuk ke akun.");
          setSubmitting(false);
          return;
        }
        setStatusMessage("Berhasil masuk. Mengalihkan ke Progres Saya...");
        router.replace("/progress");
      } else {
        const res = await registerWithEmail(displayName, email, password);
        if (!res.ok) {
          setErrorMessage(res.error ?? "Gagal mendaftarkan akun baru.");
          setSubmitting(false);
          return;
        }
        setStatusMessage("Akun berhasil dibuat. Mengalihkan ke Progres Saya...");
        router.replace("/progress");
      }
    } catch {
      setSubmitting(false);
    }
  }

  async function handleJudgeDemo() {
    setErrorMessage(null);
    setStatusMessage(null);
    setSubmitting(true);
    try {
      const res = await loginAsJudgeDemo();
      if (!res.ok) {
        setErrorMessage(res.error ?? "Gagal mengaktifkan Akun Demo Juri.");
        setSubmitting(false);
        return;
      }
      setStatusMessage("Akun Demo Juri aktif. Mengalihkan ke Progres Saya...");
      router.replace("/progress");
    } catch {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <div className="grid items-start gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        {/* Kolom Kiri: Penjelasan Hybrid Auth & Panel Akun Demo Juri */}
        <section className="order-2 lg:order-1 space-y-6">
          <div className="card bg-grape p-5 sm:p-8 text-white">
            <h1 className="font-display text-2xl font-bold leading-tight sm:text-4xl">
              Simpan Perjalanan Belajarmu dan Buka Fitur Personalisasi
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-white/90 sm:text-base">
              Seluruh materi BISINDO dan simulator Braille di SIGNIFY dapat
              dimainkan langsung sebagai Tamu. Dengan masuk ke akun, kamu
              membuka fitur personalisasi penuh yang tersimpan di akunmu.
            </p>

            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              <li className="flex items-start gap-3 rounded-2xl border-2 border-white/30 bg-white/10 p-3 sm:p-3.5">
                <Zap className="mt-0.5 h-5 w-5 shrink-0 text-sun" aria-hidden="true" />
                <div>
                  <p className="font-bold text-sm sm:text-base">Streak Belajar Harian</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-white/85">
                    Catat konsistensi latihan harianmu setiap menyelesaikan
                    huruf atau kuis.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3 rounded-2xl border-2 border-white/30 bg-white/10 p-3 sm:p-3.5">
                <Award className="mt-0.5 h-5 w-5 shrink-0 text-mint" aria-hidden="true" />
                <div>
                  <p className="font-bold text-sm sm:text-base">8 Badge Pencapaian</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-white/85">
                    Kumpulkan lencana mulai dari Langkah Pertama hingga Duta
                    Inklusif.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3 rounded-2xl border-2 border-white/30 bg-white/10 p-3 sm:p-3.5">
                <Users className="mt-0.5 h-5 w-5 shrink-0 text-sun" aria-hidden="true" />
                <div>
                  <p className="font-bold text-sm sm:text-base">Papan Peringkat</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-white/85">
                    Lihat posisimu di antara pembelajar lain berdasarkan XP dan
                    Streak.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3 rounded-2xl border-2 border-white/30 bg-white/10 p-3 sm:p-3.5">
                <Shield className="mt-0.5 h-5 w-5 shrink-0 text-mint" aria-hidden="true" />
                <div>
                  <p className="font-bold text-sm sm:text-base">Gabung Progres Tamu</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-white/85">
                    Huruf yang sudah kamu pelajari sebagai Tamu otomatis
                    digabungkan saat masuk.
                  </p>
                </div>
              </li>
            </ul>
          </div>

          {/* Kartu Akun Demo Juri IT RUSH 2026 */}
          <div className="card bg-sun p-5 sm:p-6 text-ink">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-ink/80">
                  Akses Penilaian Cepat (IT RUSH 2026)
                </p>
                <h2 className="mt-1 font-display text-xl font-bold sm:text-2xl">
                  Masuk Instan dengan Akun Demo Juri
                </h2>
              </div>
              <UserCheck className="h-6 w-6 sm:h-7 sm:w-7 shrink-0 text-ink" aria-hidden="true" />
            </div>

            <p className="mt-2 text-xs leading-relaxed text-ink/90 sm:text-sm">
              Untuk memudahkan pengujian fitur personalisasi tanpa perlu mengetik
              formulir pendaftaran, gunakan tombol di bawah ini. Sistem akan
              langsung mengaktifkan akun demo yang sudah memiliki contoh
              progres, Streak aktif, Badge terbuka, dan peringkat di
              Leaderboard.
            </p>

            <div className="mt-4 rounded-2xl border-2 border-ink bg-white/85 p-3 text-xs">
              <p className="font-bold">Kredensial Demo (Jika Masuk Manual):</p>
              <p className="mt-1 break-words">
                Email: <code className="font-bold">juri.demo@signify.id</code> |
                Sandi: <code className="font-bold">SignifyItRush2026!</code>
              </p>
            </div>

            <button
              type="button"
              onClick={handleJudgeDemo}
              disabled={submitting}
              className="btn mt-4 w-full bg-ink text-white hover:bg-grape disabled:opacity-60 text-sm sm:text-base"
            >
              <UserCheck className="h-5 w-5" aria-hidden="true" />
              {submitting ? "Mengaktifkan Akun Demo..." : "Masuk Instan: Akun Demo Juri (1-Klik)"}
            </button>
          </div>
        </section>

        {/* Kolom Kanan: Maskot Interaktif Owli & Form Login / Register */}
        <section className="order-1 lg:order-2 card bg-white p-4 sm:p-8">
          {isAuthenticated && data.auth.user ? (
            <div className="py-8 text-center" role="status" aria-live="polite">
              <CheckCircle className="mx-auto h-12 w-12 text-ink" aria-hidden="true" />
              <p className="mt-3 font-display text-2xl font-bold text-ink">
                Berhasil masuk sebagai {data.auth.user.displayName}
              </p>
              <p className="mt-1 text-sm font-semibold text-ink/75">
                Mengalihkan langsung ke halaman Progres Saya...
              </p>
            </div>
          ) : (
            <>
              {/* Maskot Owli yang merespons kursor, ketikan huruf, dan kata sandi */}
              <div className="mb-4 flex justify-center rounded-2xl border-2 border-ink bg-paper pt-3 pb-1">
                <AuthMascot
                  pose={mascotPose}
                  mode={tab}
                  typingTarget={typingTarget}
                  className="max-w-[240px] sm:max-w-none"
                />
              </div>

              <div
                className="grid grid-cols-2 gap-2 rounded-2xl border-2 border-ink bg-paper p-1.5"
                role="tablist"
                aria-label="Pilih mode autentikasi"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === "login"}
                  onClick={() => {
                    setTab("login");
                    setErrorMessage(null);
                  }}
                  className={`flex min-h-[44px] items-center justify-center gap-2 rounded-xl font-display font-bold transition ${
                    tab === "login" ? "bg-ink text-white" : "text-ink hover:bg-sun/50"
                  }`}
                >
                  <LogIn className="h-4 w-4" aria-hidden="true" />
                  Masuk Akun
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === "register"}
                  onClick={() => {
                    setTab("register");
                    setErrorMessage(null);
                  }}
                  className={`flex min-h-[44px] items-center justify-center gap-2 rounded-xl font-display font-bold transition ${
                    tab === "register" ? "bg-ink text-white" : "text-ink hover:bg-sun/50"
                  }`}
                >
                  <UserPlus className="h-4 w-4" aria-hidden="true" />
                  Daftar Baru
                </button>
              </div>

              {guestLearnedCount > 0 && (
                <div className="mt-4 flex items-start gap-2.5 rounded-2xl border-2 border-ink bg-sky p-3.5 text-xs text-ink">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <p>
                    Kamu sudah mempelajari{" "}
                    <strong>{guestLearnedCount} materi</strong> pada sesi Tamu
                    ini. Seluruhnya akan otomatis digabungkan ke akunmu setelah
                    masuk atau mendaftar.
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
                {tab === "register" && (
                  <div>
                    <label
                      htmlFor="auth-display-name"
                      className="block text-sm font-bold text-ink"
                    >
                      Nama Tampilan
                    </label>
                    <input
                      id="auth-display-name"
                      type="text"
                      required
                      autoComplete="name"
                      value={displayName}
                      onFocus={(e) => {
                        setIsPasswordFocused(false);
                        updateTypingGaze("name", e.currentTarget);
                      }}
                      onClick={(e) => updateTypingGaze("name", e.currentTarget)}
                      onKeyUp={(e) => updateTypingGaze("name", e.currentTarget)}
                      onChange={(e) => {
                        setDisplayName(e.target.value);
                        updateTypingGaze("name", e.currentTarget);
                      }}
                      placeholder="Nama panggilan Anda"
                      className="mt-1.5 min-h-[48px] w-full rounded-xl border-2 border-ink bg-paper px-4 py-2.5 font-semibold text-ink outline-none focus:bg-white focus:ring-4 focus:ring-grape/30"
                    />
                  </div>
                )}

                <div>
                  <label
                    htmlFor="auth-email"
                    className="block text-sm font-bold text-ink"
                  >
                    Alamat Email
                  </label>
                  <input
                    id="auth-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onFocus={(e) => {
                      setIsPasswordFocused(false);
                      updateTypingGaze("email", e.currentTarget);
                    }}
                    onClick={(e) => updateTypingGaze("email", e.currentTarget)}
                    onKeyUp={(e) => updateTypingGaze("email", e.currentTarget)}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      updateTypingGaze("email", e.currentTarget);
                    }}
                    placeholder="nama@email.com"
                    className="mt-1.5 min-h-[48px] w-full rounded-xl border-2 border-ink bg-paper px-4 py-2.5 font-semibold text-ink outline-none focus:bg-white focus:ring-4 focus:ring-grape/30"
                  />
                </div>

                <div>
                  <label
                    htmlFor="auth-password"
                    className="block text-sm font-bold text-ink"
                  >
                    Kata Sandi
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      id="auth-password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete={tab === "login" ? "current-password" : "new-password"}
                      value={password}
                      onFocus={(e) => {
                        setIsPasswordFocused(true);
                        updateTypingGaze("password", e.currentTarget);
                      }}
                      onBlur={() => setIsPasswordFocused(false)}
                      onClick={(e) => updateTypingGaze("password", e.currentTarget)}
                      onKeyUp={(e) => updateTypingGaze("password", e.currentTarget)}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        updateTypingGaze("password", e.currentTarget);
                      }}
                      placeholder="Minimal 6 karakter"
                      className="min-h-[48px] w-full rounded-xl border-2 border-ink bg-paper py-2.5 pl-4 pr-12 font-semibold text-ink outline-none focus:bg-white focus:ring-4 focus:ring-grape/30"
                    />
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-pressed={showPassword}
                      aria-label={
                        showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
                      }
                      className="absolute right-1.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-ink/75 transition hover:bg-sun/50 hover:text-ink focus:outline-none focus:ring-2 focus:ring-ink"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        <Eye className="h-5 w-5" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                {errorMessage && (
                  <div
                    role="alert"
                    className="flex items-start gap-2.5 rounded-2xl border-2 border-ink bg-coral p-3.5 text-sm font-semibold text-ink"
                  >
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {statusMessage && (
                  <div
                    role="status"
                    className="flex items-start gap-2.5 rounded-2xl border-2 border-ink bg-mint p-3.5 text-sm font-semibold text-ink"
                  >
                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                    <span>{statusMessage}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn w-full bg-sun text-ink disabled:opacity-60"
                >
                  <Lock className="h-4 w-4" aria-hidden="true" />
                  {submitting
                    ? "Memproses..."
                    : tab === "login"
                      ? "Masuk & Aktifkan Personalisasi"
                      : "Daftar Akun & Simpan Progres"}
                </button>
              </form>

              <div className="mt-6 border-t-2 border-ink/15 pt-5">
                <p className="text-center text-xs font-semibold text-ink/75">
                  Ingin langsung mencoba materi tanpa membuat akun?
                </p>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Link href="/bisindo" className="btn bg-paper text-sm text-ink">
                    Lanjut Tamu: BISINDO
                  </Link>
                  <Link href="/braille" className="btn bg-paper text-sm text-ink">
                    Lanjut Tamu: Braille
                  </Link>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
