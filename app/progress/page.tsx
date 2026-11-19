"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Award,
  BookOpen,
  Check,
  Eye,
  Flag,
  Grid as GridIcon,
  Layers,
  Lock,
  LogIn,
  LogOut,
  MessageCircle,
  RefreshCw,
  Smile,
  UserCheck,
  Users,
  Zap,
} from "react-feather";
import AvatarPickerModal from "@/components/AvatarPickerModal";
import Mascot from "@/components/Mascot";
import UserAvatar from "@/components/UserAvatar";
import { getAvatarById } from "@/lib/avatars";
import { BADGE_DEFINITIONS, type BadgeDefinition } from "@/lib/badges";
import { WORD_ITEMS } from "@/lib/bisindo";
import { LETTERS } from "@/lib/braille";
import { useProgress } from "@/lib/storage/useProgress";

function BadgeIcon({
  name,
  className,
}: {
  name: BadgeDefinition["iconName"];
  className?: string;
}) {
  switch (name) {
    case "flag":
      return <Flag className={className} aria-hidden="true" />;
    case "book":
      return <BookOpen className={className} aria-hidden="true" />;
    case "layers":
      return <Layers className={className} aria-hidden="true" />;
    case "message":
      return <MessageCircle className={className} aria-hidden="true" />;
    case "grid":
      return <GridIcon className={className} aria-hidden="true" />;
    case "eye":
      return <Eye className={className} aria-hidden="true" />;
    case "zap":
      return <Zap className={className} aria-hidden="true" />;
    case "award":
      return <Award className={className} aria-hidden="true" />;
  }
}

function MasteryGrid({ title, learned }: { title: string; learned: string[] }) {
  return (
    <section className="card bg-white p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl sm:text-2xl font-bold">{title}</h2>
        <span className="rounded-full border-2 border-ink bg-mint px-2.5 sm:px-3 py-0.5 sm:py-1 text-[11px] sm:text-xs font-bold text-ink">
          {learned.length}/26 dikuasai
        </span>
      </div>
      <ul
        className="mt-3 sm:mt-4 grid gap-1.5 sm:gap-2"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(36px, 1fr))" }}
      >
        {LETTERS.map((l) => {
          const isDone = learned.includes(l);
          return (
            <li
              key={l}
              aria-label={`Huruf ${l}: ${isDone ? "sudah dipelajari" : "belum dipelajari"}`}
              className={`flex h-9 sm:h-11 items-center justify-center rounded-lg sm:rounded-xl border-2 border-ink font-display text-xs sm:text-base font-bold ${
                isDone ? "bg-mint text-ink" : "bg-paper text-ink/70"
              }`}
            >
              {l}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default function ProgressPage() {
  const {
    data,
    reset,
    setAvatar,
    loginAsJudgeDemo,
    logout,
    refreshLeaderboard,
  } = useProgress();

  const [confirmReset, setConfirmReset] = useState(false);
  const [activatingDemo, setActivatingDemo] = useState(false);
  const [refreshingBoard, setRefreshingBoard] = useState(false);
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);

  const isAuthenticated =
    data.auth.mode === "authenticated" && Boolean(data.auth.user);

  useEffect(() => {
    void refreshLeaderboard();
  }, [refreshLeaderboard]);

  const level = Math.floor(data.xp / 100) + 1;
  const nextLevelXp = level * 100;
  const totalMaterialsLearned =
    data.bisindo.learnedLetters.length +
    (data.bisindo.learnedWords ?? []).length +
    data.braille.learnedLetters.length;

  const currentAvatarId = data.auth.user?.avatarId || data.settings.avatarId || "owli";
  const currentAvatar = getAvatarById(currentAvatarId);

  async function handleQuickJudgeDemo() {
    setActivatingDemo(true);
    try {
      await loginAsJudgeDemo();
    } finally {
      setActivatingDemo(false);
    }
  }

  async function handleRefreshLeaderboard() {
    setRefreshingBoard(true);
    try {
      await refreshLeaderboard();
    } finally {
      setRefreshingBoard(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:py-10">
      {/* Header & Kartu Status Akun / Mode Tamu */}
      {isAuthenticated && data.auth.user ? (
        <section className="card bg-grape p-6 text-white sm:p-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="flex items-start gap-4 sm:items-center">
              <div className="relative group shrink-0">
                <UserAvatar
                  avatarId={currentAvatarId}
                  size="lg"
                  className="shadow-popsm transition group-hover:scale-105"
                />
                <button
                  type="button"
                  onClick={() => setIsAvatarPickerOpen(true)}
                  aria-label="Pilih avatar karakter"
                  title="Ganti Avatar"
                  className="absolute -bottom-2 -right-2 inline-flex h-8 w-8 items-center justify-center rounded-xl border-2 border-ink bg-sun text-ink shadow-popsm transition hover:bg-white hover:scale-110"
                >
                  <Smile className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border-2 border-ink bg-mint px-3 py-0.5 text-xs font-bold text-ink">
                    {data.auth.user.isDemo ? "Akun Demo Juri" : "Akun Personal Aktif"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAvatarPickerOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/40 bg-white/15 px-3 py-0.5 text-xs font-semibold text-white transition hover:bg-white/30"
                  >
                    <Smile className="h-3 w-3" aria-hidden="true" />
                    <span>Avatar: {currentAvatar.name.split(" ")[0]}</span>
                  </button>
                  <span className="rounded-full border border-white/40 bg-white/15 px-3 py-0.5 text-xs font-semibold text-white">
                    {data.auth.source === "supabase"
                      ? "Sinkron Cloud Supabase"
                      : "Tersimpan di Perangkat"}
                  </span>
                </div>
                <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
                  {data.auth.user.displayName}
                </h1>
                <p className="text-sm text-white/85">{data.auth.user.email}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 w-full sm:w-auto">
              <Link href="/bisindo" className="btn w-full sm:w-auto text-center justify-center bg-sun text-sm text-ink">
                Lanjut Praktik
              </Link>
              <button
                type="button"
                onClick={() => void logout()}
                className="btn w-full sm:w-auto text-center justify-center bg-white text-sm text-ink"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Keluar ke Mode Tamu
              </button>
            </div>
          </div>
        </section>
      ) : (
        <section className="card bg-sun p-5 sm:p-8 text-ink">
          <div className="grid items-center gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-white px-3 py-1 text-xs font-bold">
                <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                STATUS SAAT INI: MODE TAMU (GUEST)
              </span>
              <h1 className="mt-3 font-display text-2xl font-bold leading-tight sm:text-4xl">
                Buka Fitur Streak, Badge Pencapaian, dan Papan Peringkat
              </h1>
              <p className="mt-2 text-xs leading-relaxed text-ink/90 sm:text-base">
                Sebagai Tamu, kamu tetap bebas memainkan seluruh materi kamera AI
                BISINDO, kosakata dinamis, serta simulator dan kuis Braille.
                Masuk ke akun untuk mengaktifkan perhitungan Streak harian,
                mengklaim Badge pencapaian, dan masuk ke Papan Peringkat.
              </p>
              {totalMaterialsLearned > 0 && (
                <p className="mt-3 rounded-xl border-2 border-ink bg-white/90 px-3.5 py-2 text-xs font-bold">
                  Kamu sudah menyelesaikan {totalMaterialsLearned} materi di sesi
                  Tamu ini. Progres tersebut otomatis digabungkan saat kamu masuk.
                </p>
              )}
              <div className="mt-5 flex flex-col sm:flex-row flex-wrap gap-2.5 sm:gap-3">
                <Link href="/login" className="btn w-full sm:w-auto text-center justify-center bg-ink text-white hover:bg-grape text-sm">
                  <LogIn className="h-4 w-4" aria-hidden="true" />
                  Masuk / Daftar Akun
                </Link>
                <button
                  type="button"
                  onClick={handleQuickJudgeDemo}
                  disabled={activatingDemo}
                  className="btn w-full sm:w-auto text-center justify-center bg-white text-ink disabled:opacity-60 text-sm"
                >
                  <UserCheck className="h-4 w-4" aria-hidden="true" />
                  {activatingDemo
                    ? "Mengaktifkan Demo..."
                    : "Coba Akun Demo Juri (1-Klik)"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAvatarPickerOpen(true)}
                  className="btn w-full sm:w-auto text-center justify-center bg-paper text-ink text-sm"
                >
                  <Smile className="h-4 w-4" aria-hidden="true" />
                  Pilih Avatar ({currentAvatar.name.split(" ")[0]})
                </button>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center rounded-2xl border-4 border-ink bg-paper p-5 text-center">
              <Mascot className="h-28 w-28" />
              <p className="mt-2 font-display text-lg font-bold">
                Belajar Tanpa Hambatan, Simpan Kapan Saja
              </p>
              <p className="mt-1 text-xs leading-relaxed text-ink/75">
                Coba dulu seluruh fitur sepuasnya. Saat siap menyimpan rekor dan
                lencana, cukup masuk dalam satu langkah.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Statistik Utama: Streak, Total XP, dan Level */}
      <section aria-label="Ringkasan statistik belajar">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="card bg-coral p-5 text-ink">
            <div className="flex items-center justify-between">
              <p className="font-bold">Streak Harian</p>
              <Zap className="h-5 w-5" aria-hidden="true" />
            </div>
            {isAuthenticated ? (
              <>
                <p className="mt-2 font-display text-4xl font-bold">
                  {data.streak.current} hari
                </p>
                <p className="mt-1 text-xs font-semibold text-ink/80">
                  Rekor terpanjang: {data.streak.longest} hari
                </p>
              </>
            ) : (
              <>
                <p className="mt-2 flex items-center gap-2 font-display text-2xl font-bold">
                  <Lock className="h-5 w-5 shrink-0" aria-hidden="true" />
                  Terkunci (Tamu)
                </p>
                <p className="mt-1 text-xs font-semibold text-ink/85">
                  Masuk akun untuk mencatat rentetan hari belajar.
                </p>
              </>
            )}
          </div>

          <div className="card bg-sun p-5 text-ink">
            <div className="flex items-center justify-between">
              <p className="font-bold">Total XP</p>
              <Award className="h-5 w-5" aria-hidden="true" />
            </div>
            {isAuthenticated ? (
              <>
                <p className="mt-2 font-display text-4xl font-bold">
                  {data.xp} XP
                </p>
                <p className="mt-1 text-xs font-semibold text-ink/80">
                  {nextLevelXp - data.xp} XP lagi menuju Level {level + 1}
                </p>
              </>
            ) : (
              <>
                <p className="mt-2 flex items-center gap-2 font-display text-2xl font-bold">
                  <Lock className="h-5 w-5 shrink-0" aria-hidden="true" />
                  Terkunci (Tamu)
                </p>
                <p className="mt-1 text-xs font-semibold text-ink/85">
                  XP dari {totalMaterialsLearned} materi sesi ini siap diklaim saat
                  masuk.
                </p>
              </>
            )}
          </div>

          <div className="card bg-grape p-5 text-white">
            <div className="flex items-center justify-between">
              <p className="font-bold">Level Pembelajar</p>
              <Check className="h-5 w-5" aria-hidden="true" />
            </div>
            {isAuthenticated ? (
              <>
                <p className="mt-2 font-display text-4xl font-bold">
                  Level {level}
                </p>
                <p className="mt-1 text-xs font-semibold text-white/85">
                  {data.badges.length} dari {BADGE_DEFINITIONS.length} Badge terbuka
                </p>
              </>
            ) : (
              <>
                <p className="mt-2 flex items-center gap-2 font-display text-2xl font-bold">
                  <Lock className="h-5 w-5 shrink-0" aria-hidden="true" />
                  Terkunci (Tamu)
                </p>
                <p className="mt-1 text-xs font-semibold text-white/85">
                  Aktifkan akun untuk menaikkan level pembelajar.
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Koleksi 8 Badge Pencapaian (Achievements) */}
      <section className="card bg-white p-4 sm:p-6" aria-labelledby="heading-badges">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-grape">
              PENCAPAIAN PEMBELAJAR
            </p>
            <h2 id="heading-badges" className="mt-1 font-display text-2xl font-bold sm:text-3xl">
              Koleksi Badge Pencapaian
            </h2>
            <p className="mt-1 text-sm text-ink/75">
              {isAuthenticated
                ? "Badge terbuka secara otomatis ketika kamu memenuhi syarat materi atau latihan."
                : "Pratinjau lencana yang dapat kamu buka setelah masuk ke akun personal."}
            </p>
          </div>

          {isAuthenticated ? (
            <span className="rounded-full border-2 border-ink bg-mint px-4 py-1.5 text-sm font-bold text-ink">
              {data.badges.length}/{BADGE_DEFINITIONS.length} Badge Terbuka
            </span>
          ) : (
            <Link href="/login" className="btn !min-h-[44px] bg-sun !px-4 text-sm text-ink">
              <Lock className="h-4 w-4" aria-hidden="true" />
              Masuk untuk Klaim Badge
            </Link>
          )}
        </div>

        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BADGE_DEFINITIONS.map((badge) => {
            const evalResult = badge.evaluate({
              xp: data.xp,
              streak: data.streak,
              bisindo: data.bisindo,
              braille: data.braille,
            });
            const isUnlocked = isAuthenticated && data.badges.includes(badge.id);
            const pct = Math.min(
              100,
              Math.round((evalResult.current / evalResult.target) * 100)
            );
            const isDarkCard = isUnlocked && badge.color === "bg-grape";

            return (
              <li
                key={badge.id}
                className={`flex flex-col justify-between rounded-2xl border-4 border-ink p-4 transition ${
                  isUnlocked
                    ? `${badge.color} ${isDarkCard ? "text-white" : "text-ink"} shadow-popsm`
                    : "bg-paper text-ink"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`flex h-11 w-11 items-center justify-center rounded-xl border-2 border-ink ${
                        isUnlocked ? "bg-white text-ink" : "bg-white/70 text-ink/70"
                      }`}
                    >
                      <BadgeIcon name={badge.iconName} className="h-5 w-5" />
                    </span>

                    {isUnlocked ? (
                      <span className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-white px-2.5 py-0.5 text-xs font-bold text-ink">
                        <Check className="h-3 w-3" aria-hidden="true" />
                        Terbuka
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-ink/40 bg-white px-2.5 py-0.5 text-xs font-bold text-ink/75">
                        <Lock className="h-3 w-3" aria-hidden="true" />
                        {isAuthenticated ? "Belum Terbuka" : "Khusus Akun"}
                      </span>
                    )}
                  </div>

                  <h3 className="mt-3 font-display text-lg font-bold">
                    {badge.title}
                  </h3>
                  <p
                    className={`mt-1 text-xs leading-relaxed ${
                      isDarkCard ? "text-white/90" : "text-ink/80"
                    }`}
                  >
                    {badge.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t-2 border-ink/15">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>Syarat progres</span>
                    <span>
                      {evalResult.current}/{evalResult.target}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2.5 overflow-hidden rounded-full border border-ink bg-white">
                    <div
                      className="h-full bg-ink transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p
                    className={`mt-1.5 text-[11px] font-medium ${
                      isDarkCard ? "text-white/85" : "text-ink/75"
                    }`}
                  >
                    {badge.requirementText}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Papan Peringkat Pembelajar (Leaderboard) */}
      <section className="card bg-white p-4 sm:p-6" aria-labelledby="heading-leaderboard">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-grape">
              KOMUNITAS BELAJAR INKLUSIF
            </p>
            <h2
              id="heading-leaderboard"
              className="mt-1 font-display text-2xl font-bold sm:text-3xl"
            >
              Papan Peringkat Pembelajar
            </h2>
            <p className="mt-1 text-sm text-ink/75">
              Peringkat diurutkan berdasarkan Total XP dan konsistensi Streak
              harian.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleRefreshLeaderboard}
              disabled={refreshingBoard}
              className="btn !min-h-[44px] bg-paper !px-4 text-sm text-ink"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              {refreshingBoard ? "Memuat..." : "Perbarui"}
            </button>
            {!isAuthenticated && (
              <Link
                href="/login"
                className="btn !min-h-[44px] bg-sun !px-4 text-sm text-ink"
              >
                <Users className="h-4 w-4" aria-hidden="true" />
                Ikut Papan Peringkat
              </Link>
            )}
          </div>
        </div>

        {!isAuthenticated && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-ink bg-sky p-4 text-sm text-ink">
            <p className="font-semibold">
              Kamu sedang melihat Papan Peringkat dalam Mode Tamu. Masuk ke akun
              agar namamu dan perolehan XP-mu tercatat di daftar peringkat.
            </p>
            <button
              type="button"
              onClick={handleQuickJudgeDemo}
              className="btn !min-h-[40px] bg-white !px-3.5 text-xs text-ink"
            >
              Masuk Akun Demo Juri
            </button>
          </div>
        )}

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left">
            <thead>
              <tr className="border-b-4 border-ink text-xs font-bold uppercase tracking-wider text-ink/75">
                <th className="py-3 pl-3 pr-2">Peringkat</th>
                <th className="px-3 py-3">Nama Pembelajar</th>
                <th className="px-3 py-3">Streak</th>
                <th className="px-3 py-3">Badge</th>
                <th className="py-3 pl-3 pr-3 text-right">Total XP</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-ink/15 text-sm">
              {data.leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center font-semibold text-ink/75">
                    Belum ada data peringkat dari database Supabase. Klik Perbarui atau pastikan .env.local sudah terpasang.
                  </td>
                </tr>
              ) : (
                data.leaderboard.map((row, idx) => {
                  const rank = idx + 1;
                  const isMe = Boolean(row.isCurrentUser && isAuthenticated);
                  return (
                    <tr
                      key={row.id}
                      className={
                        isMe
                          ? "bg-sun/60 font-bold text-ink"
                          : "hover:bg-paper"
                      }
                    >
                      <td className="py-3.5 pl-3 pr-2 font-display text-lg font-bold">
                        #{rank}
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <UserAvatar
                            avatarId={row.avatarId}
                            size="xs"
                            className="!border shrink-0"
                          />
                          <span className="font-bold">{row.displayName}</span>
                          {isMe && (
                            <span className="rounded-full border-2 border-ink bg-mint px-2.5 py-0.5 text-xs font-bold text-ink">
                              Akunmu
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3.5 font-semibold">
                        {row.streakCurrent} hari
                      </td>
                      <td className="px-3 py-3.5 font-semibold">
                        {row.badgeCount} lencana
                      </td>
                      <td className="py-3.5 pl-3 pr-3 text-right font-display text-lg font-bold">
                        {row.xp} XP
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-center text-xs font-semibold text-ink/60 sm:hidden">
          ← Geser tabel ke samping untuk melihat rincian peringkat →
        </p>
      </section>

      {/* Detail Penguasaan Materi (Tampil untuk Tamu maupun Akun) */}
      <MasteryGrid
        title="Penguasaan Huruf BISINDO"
        learned={data.bisindo.learnedLetters}
      />

      <section className="card space-y-4 bg-white p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-2xl font-bold">
            Kosakata Dasar BISINDO
          </h2>
          <span className="rounded-full border-2 border-ink bg-mint px-3 py-1 text-xs font-bold text-ink">
            {(data.bisindo.learnedWords ?? []).length}/{WORD_ITEMS.length} dikuasai
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {WORD_ITEMS.map((item) => {
            const done = (data.bisindo.learnedWords ?? []).includes(item.id);
            return (
              <div
                key={item.id}
                className={`rounded-xl border-2 border-ink p-3 ${
                  done ? "bg-mint text-ink" : "bg-paper text-ink/75"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold">{item.title}</span>
                  <span className="text-xs font-bold">
                    {done ? "Selesai" : `${item.hands} Tangan`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <MasteryGrid
        title="Penguasaan Huruf Braille"
        learned={data.braille.learnedLetters}
      />

      {/* Footer Info Penyimpanan & Reset */}
      <section className="card flex flex-wrap items-center justify-between gap-4 bg-paper p-5">
        <p className="text-sm text-ink/80">
          {isAuthenticated
            ? "Progres belajarmu disinkronkan ke akun aktif serta dicadangkan pada peramban ini."
            : "Progres materi di atas disimpan sementara pada sesi peramban ini. Masuk ke akun untuk menyimpannya secara permanen."}
        </p>

        {confirmReset ? (
          <div
            className="flex flex-wrap items-center gap-3"
            role="alertdialog"
            aria-label="Konfirmasi reset progres"
          >
            <span className="text-sm font-bold">Hapus seluruh progres materi?</span>
            <button
              type="button"
              onClick={() => {
                reset();
                setConfirmReset(false);
              }}
              className="btn !min-h-[44px] bg-coral !px-4 text-sm text-ink"
            >
              Ya, Reset Data
            </button>
            <button
              type="button"
              onClick={() => setConfirmReset(false)}
              className="btn !min-h-[44px] bg-white !px-4 text-sm text-ink"
            >
              Batal
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="btn !min-h-[44px] bg-white !px-4 text-sm text-ink"
          >
            Reset Data Belajar
          </button>
        )}
      </section>

      {/* Modal Pemilih Avatar */}
      <AvatarPickerModal
        isOpen={isAvatarPickerOpen}
        currentAvatarId={currentAvatarId}
        onClose={() => setIsAvatarPickerOpen(false)}
        onSelect={(newAvatarId) => setAvatar(newAvatarId)}
      />
    </div>
  );
}
