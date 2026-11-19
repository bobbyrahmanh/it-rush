import { evaluateBadges } from "@/lib/badges";
import {
  fetchSupabaseLeaderboard,
  fetchSupabaseProfile,
  isSupabaseConfigured,
  supabaseSignIn,
  supabaseSignOut,
  supabaseSignUp,
  upsertSupabaseProfile,
  type RemoteProfileRow,
} from "@/lib/supabase/client";

export type Mod = "bisindo" | "braille";

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  avatarId?: string;
  isDemo?: boolean;
}

export interface AuthState {
  mode: "guest" | "authenticated";
  user: AuthUser | null;
  source: "supabase" | "local";
  syncing: boolean;
}

export interface LeaderboardEntry {
  id: string;
  displayName: string;
  avatarId?: string;
  xp: number;
  streakCurrent: number;
  badgeCount: number;
  isCurrentUser?: boolean;
}

export interface ProgressData {
  schemaVersion: 1;
  xp: number;
  streak: { current: number; longest: number; lastActiveDate: string | null };
  settings: {
    audioEnabled: boolean;
    showLandmarks: boolean;
    avatarId: string;
  };
  bisindo: {
    learnedLetters: string[];
    learnedWords: string[];
    practiceSessionsCompleted: number;
    guessTheSignBestScore: number;
  };
  braille: { learnedLetters: string[]; quizSessionsCompleted: number };
  badges: string[];
  auth: AuthState;
  leaderboard: LeaderboardEntry[];
}

const KEY = "signify_progress_v1";
const GUEST_KEY = "signify_guest_progress_v1";
const SESSION_KEY = "signify_auth_session_v1";
const MISSING_ENV_MSG =
  "Konfigurasi Supabase (.env.local) belum terpasang di perangkat ini. Silakan pasang .env.local untuk menggunakan fitur Akun, atau lanjut belajar sebagai Tamu.";

const day = (d: Date) => d.toLocaleDateString("sv-SE");

export const DEFAULT_PROGRESS: ProgressData = {
  schemaVersion: 1,
  xp: 0,
  streak: { current: 0, longest: 0, lastActiveDate: null },
  settings: { audioEnabled: true, showLandmarks: true, avatarId: "owli" },
  bisindo: {
    learnedLetters: [],
    learnedWords: [],
    practiceSessionsCompleted: 0,
    guessTheSignBestScore: 0,
  },
  braille: { learnedLetters: [], quizSessionsCompleted: 0 },
  badges: [],
  auth: {
    mode: "guest",
    user: null,
    source: "local",
    syncing: false,
  },
  leaderboard: [],
};

let cache: ProgressData | null = null;
let activeAccessToken: string | undefined = undefined;
let remoteLeaderboardCache: LeaderboardEntry[] = [];
const listeners = new Set<() => void>();

function uniqueStrings(items: string[]): string[] {
  return Array.from(new Set(items.filter((x) => typeof x === "string" && x.length > 0)));
}

function minimumXpFromProgress(
  bisindo: ProgressData["bisindo"],
  braille: ProgressData["braille"]
): number {
  const bisindoLettersXp = bisindo.learnedLetters.length * 10;
  const bisindoWordsXp = (bisindo.learnedWords ?? []).length * 15;
  const guessXp = (bisindo.guessTheSignBestScore ?? 0) > 0 ? 20 : 0;
  const brailleLettersXp = braille.learnedLetters.length * 10;
  const brailleQuizXp = braille.quizSessionsCompleted * 15;
  return bisindoLettersXp + bisindoWordsXp + guessXp + brailleLettersXp + brailleQuizXp;
}

function buildLeaderboard(state: ProgressData): LeaderboardEntry[] {
  const entries = new Map<string, LeaderboardEntry>();

  for (const row of remoteLeaderboardCache) {
    entries.set(row.id, {
      ...row,
      isCurrentUser: state.auth.user?.id === row.id,
    });
  }

  if (state.auth.mode === "authenticated" && state.auth.user) {
    entries.set(state.auth.user.id, {
      id: state.auth.user.id,
      displayName: state.auth.user.displayName,
      avatarId: state.auth.user.avatarId || state.settings.avatarId || "owli",
      xp: state.xp,
      streakCurrent: state.streak.current,
      badgeCount: state.badges.length,
      isCurrentUser: true,
    });
  }

  return Array.from(entries.values())
    .sort((a, b) => b.xp - a.xp || b.streakCurrent - a.streakCurrent)
    .slice(0, 10);
}

function sanitizeProgress(raw: Partial<ProgressData> | null | undefined): ProgressData {
  if (!raw || raw.schemaVersion !== 1) return DEFAULT_PROGRESS;

  const isValidSupabaseAuth =
    isSupabaseConfigured() &&
    raw.auth?.mode === "authenticated" &&
    raw.auth?.source === "supabase" &&
    Boolean(raw.auth?.user);

  const authMode = isValidSupabaseAuth ? "authenticated" : "guest";

  const avatarId =
    typeof raw.settings?.avatarId === "string" && raw.settings.avatarId
      ? raw.settings.avatarId
      : typeof raw.auth?.user?.avatarId === "string" && raw.auth.user.avatarId
        ? raw.auth.user.avatarId
        : "owli";

  const bisindo: ProgressData["bisindo"] = {
    learnedLetters: uniqueStrings(raw.bisindo?.learnedLetters ?? []),
    learnedWords: uniqueStrings(raw.bisindo?.learnedWords ?? []),
    practiceSessionsCompleted: Number(raw.bisindo?.practiceSessionsCompleted ?? 0),
    guessTheSignBestScore: Number(raw.bisindo?.guessTheSignBestScore ?? 0),
  };
  const braille: ProgressData["braille"] = {
    learnedLetters: uniqueStrings(raw.braille?.learnedLetters ?? []),
    quizSessionsCompleted: Number(raw.braille?.quizSessionsCompleted ?? 0),
  };
  const streak =
    authMode === "authenticated"
      ? {
          current: Number(raw.streak?.current ?? 0),
          longest: Number(raw.streak?.longest ?? 0),
          lastActiveDate: raw.streak?.lastActiveDate ?? null,
        }
      : { current: 0, longest: 0, lastActiveDate: null };

  const xp =
    authMode === "authenticated"
      ? Math.max(Number(raw.xp ?? 0), minimumXpFromProgress(bisindo, braille))
      : 0;

  const user =
    authMode === "authenticated" && raw.auth?.user
      ? { ...raw.auth.user, avatarId: raw.auth.user.avatarId || avatarId }
      : null;

  const base: ProgressData = {
    schemaVersion: 1,
    xp,
    streak,
    settings: {
      audioEnabled: raw.settings?.audioEnabled ?? true,
      showLandmarks: raw.settings?.showLandmarks ?? true,
      avatarId,
    },
    bisindo,
    braille,
    badges: authMode === "authenticated" ? evaluateBadges({ xp, streak, bisindo, braille }) : [],
    auth: {
      mode: authMode,
      user,
      source: authMode === "authenticated" ? "supabase" : "local",
      syncing: false,
    },
    leaderboard: [],
  };

  base.leaderboard = buildLeaderboard(base);
  return base;
}

function load(): ProgressData {
  if (typeof window === "undefined") return DEFAULT_PROGRESS;
  try {
    const savedToken = window.localStorage.getItem(SESSION_KEY);
    if (savedToken) activeAccessToken = savedToken;
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_PROGRESS;
    return sanitizeProgress(JSON.parse(raw));
  } catch {
    return DEFAULT_PROGRESS;
  }
}

async function syncToSupabaseIfActive(state: ProgressData) {
  if (
    state.auth.mode !== "authenticated" ||
    !state.auth.user ||
    !isSupabaseConfigured()
  ) {
    return;
  }

  const row: RemoteProfileRow = {
    id: state.auth.user.id,
    email: state.auth.user.email,
    display_name: state.auth.user.displayName,
    xp: state.xp,
    streak_current: state.streak.current,
    streak_longest: state.streak.longest,
    last_active_date: state.streak.lastActiveDate,
    badges: state.badges,
    progress_data: {
      bisindo: state.bisindo,
      braille: state.braille,
      avatarId: state.auth.user.avatarId || state.settings.avatarId || "owli",
    },
  };

  await upsertSupabaseProfile(row, activeAccessToken);
}

function commit(next: ProgressData, triggerRemoteSync = true) {
  const evaluatedBadges =
    next.auth.mode === "authenticated"
      ? evaluateBadges({
          xp: next.xp,
          streak: next.streak,
          bisindo: next.bisindo,
          braille: next.braille,
        })
      : [];

  const withMeta: ProgressData = {
    ...next,
    badges: evaluatedBadges,
  };
  withMeta.leaderboard = buildLeaderboard(withMeta);
  cache = withMeta;

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(withMeta));
      if (withMeta.auth.mode === "guest") {
        window.localStorage.setItem(
          GUEST_KEY,
          JSON.stringify({ bisindo: withMeta.bisindo, braille: withMeta.braille })
        );
      }
    } catch {
      // Abaikan jika penyimpanan lokal dibatasi
    }
  }

  if (triggerRemoteSync) {
    void syncToSupabaseIfActive(withMeta);
  }
  listeners.forEach((l) => l());
}

const current = () => (cache ??= load());

function withStreak(p: ProgressData): ProgressData {
  if (p.auth.mode !== "authenticated") {
    return {
      ...p,
      xp: 0,
      streak: { current: 0, longest: 0, lastActiveDate: null },
    };
  }
  const today = day(new Date());
  const last = p.streak.lastActiveDate;
  if (last === today && p.streak.current > 0) return p;
  const cur =
    last === day(new Date(Date.now() - 864e5))
      ? p.streak.current + 1
      : Math.max(1, p.streak.current);
  return {
    ...p,
    streak: {
      current: cur,
      longest: Math.max(cur, p.streak.longest),
      lastActiveDate: today,
    },
  };
}

function mergeProgressSets(
  guestBisindo: ProgressData["bisindo"],
  guestBraille: ProgressData["braille"],
  accountBisindo?: Partial<ProgressData["bisindo"]>,
  accountBraille?: Partial<ProgressData["braille"]>
): { bisindo: ProgressData["bisindo"]; braille: ProgressData["braille"] } {
  const bisindo: ProgressData["bisindo"] = {
    learnedLetters: uniqueStrings([
      ...(accountBisindo?.learnedLetters ?? []),
      ...guestBisindo.learnedLetters,
    ]),
    learnedWords: uniqueStrings([
      ...(accountBisindo?.learnedWords ?? []),
      ...(guestBisindo.learnedWords ?? []),
    ]),
    practiceSessionsCompleted: Math.max(
      Number(accountBisindo?.practiceSessionsCompleted ?? 0),
      guestBisindo.practiceSessionsCompleted
    ),
    guessTheSignBestScore: Math.max(
      Number(accountBisindo?.guessTheSignBestScore ?? 0),
      guestBisindo.guessTheSignBestScore
    ),
  };

  const braille: ProgressData["braille"] = {
    learnedLetters: uniqueStrings([
      ...(accountBraille?.learnedLetters ?? []),
      ...guestBraille.learnedLetters,
    ]),
    quizSessionsCompleted: Math.max(
      Number(accountBraille?.quizSessionsCompleted ?? 0),
      guestBraille.quizSessionsCompleted
    ),
  };

  return { bisindo, braille };
}

export const progressRepository = {
  subscribe(cb: () => void) {
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  },
  getSnapshot: () => current(),
  getServerSnapshot: () => DEFAULT_PROGRESS,
  actions: {
    markLearned(mod: Mod, letter: string, xp = 10) {
      const p = current();
      if (p[mod].learnedLetters.includes(letter)) return;
      const nextMod = {
        ...p[mod],
        learnedLetters: [...p[mod].learnedLetters, letter],
      };
      const nextXp = p.auth.mode === "authenticated" ? p.xp + xp : 0;
      commit(withStreak({ ...p, xp: nextXp, [mod]: nextMod }));
    },

    markWordLearned(word: string, xp = 15) {
      const p = current();
      const learnedWords = p.bisindo.learnedWords ?? [];
      if (learnedWords.includes(word)) return;
      const nextXp = p.auth.mode === "authenticated" ? p.xp + xp : 0;
      commit(
        withStreak({
          ...p,
          xp: nextXp,
          bisindo: { ...p.bisindo, learnedWords: [...learnedWords, word] },
        })
      );
    },

    completeGuessTheSign(score: number, total: number, xp = 20) {
      const p = current();
      const percent = total > 0 ? Math.round((score / total) * 100) : 0;
      const nextXp = p.auth.mode === "authenticated" ? p.xp + xp : 0;
      commit(
        withStreak({
          ...p,
          xp: nextXp,
          bisindo: {
            ...p.bisindo,
            guessTheSignBestScore: Math.max(p.bisindo.guessTheSignBestScore ?? 0, percent),
          },
        })
      );
    },

    completeBrailleQuiz(xp = 15) {
      const p = current();
      const nextXp = p.auth.mode === "authenticated" ? p.xp + xp : 0;
      commit(
        withStreak({
          ...p,
          xp: nextXp,
          braille: {
            ...p.braille,
            quizSessionsCompleted: p.braille.quizSessionsCompleted + 1,
          },
        })
      );
    },

    setAudio(enabled: boolean) {
      const p = current();
      commit({ ...p, settings: { ...p.settings, audioEnabled: enabled } }, false);
    },

    reset() {
      const p = current();
      if (p.auth.mode === "authenticated" && p.auth.user) {
        const today = day(new Date());
        commit({
          ...DEFAULT_PROGRESS,
          settings: p.settings,
          streak: { current: 1, longest: 1, lastActiveDate: today },
          auth: p.auth,
        });
      } else {
        commit({
          ...DEFAULT_PROGRESS,
          settings: p.settings,
        });
      }
    },

    async loginWithEmail(
      email: string,
      password: string
    ): Promise<{ ok: boolean; error?: string }> {
      if (!isSupabaseConfigured()) {
        return { ok: false, error: MISSING_ENV_MSG };
      }

      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail || !password) {
        return { ok: false, error: "Email dan kata sandi wajib diisi." };
      }

      const p = current();
      const { session, error } = await supabaseSignIn(cleanEmail, password);
      if (!session) {
        return {
          ok: false,
          error: error ?? "Email atau kata sandi tidak sesuai, atau akun belum terdaftar di Supabase.",
        };
      }

      activeAccessToken = session.accessToken;
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(SESSION_KEY, session.accessToken);
        } catch {
          // Abaikan jika localStorage penuh
        }
      }

      const remoteProfile = await fetchSupabaseProfile(
        session.user.id,
        session.accessToken
      );
      const merged = mergeProgressSets(
        p.bisindo,
        p.braille,
        remoteProfile?.progress_data?.bisindo,
        remoteProfile?.progress_data?.braille
      );
      const calcXp = Math.max(
        remoteProfile?.xp ?? 0,
        minimumXpFromProgress(merged.bisindo, merged.braille)
      );
      const today = day(new Date());
      const streakCurrent = Math.max(remoteProfile?.streak_current ?? 1, 1);
      const streakLongest = Math.max(remoteProfile?.streak_longest ?? 1, streakCurrent);

      const userAvatarId =
        remoteProfile?.progress_data?.avatarId || p.settings.avatarId || "owli";

      commit({
        ...p,
        xp: calcXp,
        streak: {
          current: streakCurrent,
          longest: streakLongest,
          lastActiveDate: remoteProfile?.last_active_date ?? today,
        },
        settings: {
          ...p.settings,
          avatarId: userAvatarId,
        },
        bisindo: merged.bisindo,
        braille: merged.braille,
        auth: {
          mode: "authenticated",
          user: {
            id: session.user.id,
            email: session.user.email,
            displayName: remoteProfile?.display_name || session.user.displayName,
            avatarId: userAvatarId,
          },
          source: "supabase",
          syncing: false,
        },
      });

      void syncToSupabaseIfActive(current()).then(() => this.refreshLeaderboard());
      return { ok: true };
    },

    async registerWithEmail(
      displayName: string,
      email: string,
      password: string
    ): Promise<{ ok: boolean; error?: string }> {
      if (!isSupabaseConfigured()) {
        return { ok: false, error: MISSING_ENV_MSG };
      }

      const cleanName = displayName.trim();
      const cleanEmail = email.trim().toLowerCase();

      if (cleanName.length < 2) {
        return { ok: false, error: "Nama tampilan minimal terdiri dari 2 karakter." };
      }
      if (!cleanEmail.includes("@")) {
        return { ok: false, error: "Masukkan alamat email yang valid." };
      }
      if (password.length < 6) {
        return { ok: false, error: "Kata sandi minimal terdiri dari 6 karakter." };
      }

      const p = current();
      const today = day(new Date());

      const { session, error } = await supabaseSignUp(
        cleanName,
        cleanEmail,
        password
      );
      if (!session) {
        return {
          ok: false,
          error: error ?? "Gagal mendaftarkan akun ke database Supabase.",
        };
      }

      activeAccessToken = session.accessToken;
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(SESSION_KEY, session.accessToken);
        } catch {
          // Abaikan jika penyimpanan lokal penuh
        }
      }

      const merged = mergeProgressSets(p.bisindo, p.braille);
      const calcXp = minimumXpFromProgress(merged.bisindo, merged.braille);
      const userAvatarId = p.settings.avatarId || "owli";

      commit({
        ...p,
        xp: calcXp,
        streak: { current: 1, longest: 1, lastActiveDate: today },
        bisindo: merged.bisindo,
        braille: merged.braille,
        auth: {
          mode: "authenticated",
          user: {
            id: session.user.id,
            email: session.user.email,
            displayName: cleanName,
            avatarId: userAvatarId,
          },
          source: "supabase",
          syncing: false,
        },
      });

      void syncToSupabaseIfActive(current()).then(() => this.refreshLeaderboard());
      return { ok: true };
    },

    async loginAsJudgeDemo(): Promise<{ ok: boolean; error?: string }> {
      if (!isSupabaseConfigured()) {
        return { ok: false, error: MISSING_ENV_MSG };
      }

      const p = current();
      const demoEmail =
        process.env.NEXT_PUBLIC_DEMO_JUDGE_EMAIL?.trim() || "juri.demo@signify.id";
      const demoPassword =
        process.env.NEXT_PUBLIC_DEMO_JUDGE_PASSWORD?.trim() || "SignifyItRush2026!";
      const demoName = "Juri IT RUSH 2026 (Akun Demo)";

      const demoPresetBisindo: ProgressData["bisindo"] = {
        learnedLetters: ["A", "E", "I", "O", "U", "B", "D", "F", "H", "K", "C", "L"],
        learnedWords: ["saya", "belajar", "terima_kasih"],
        practiceSessionsCompleted: 2,
        guessTheSignBestScore: 90,
      };
      const demoPresetBraille: ProgressData["braille"] = {
        learnedLetters: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"],
        quizSessionsCompleted: 2,
      };

      const merged = mergeProgressSets(
        p.bisindo,
        p.braille,
        demoPresetBisindo,
        demoPresetBraille
      );
      const demoXp = Math.max(315, minimumXpFromProgress(merged.bisindo, merged.braille));
      const today = day(new Date());

      const signInRes = await supabaseSignIn(demoEmail, demoPassword);
      const session =
        signInRes.session ??
        (await supabaseSignUp(demoName, demoEmail, demoPassword)).session;

      const userId = session?.user.id || "demo-judge-itrush";
      activeAccessToken = session?.accessToken ?? "";

      commit({
        ...p,
        xp: demoXp,
        streak: { current: 4, longest: 4, lastActiveDate: today },
        settings: {
          ...p.settings,
          avatarId: "owli",
        },
        bisindo: merged.bisindo,
        braille: merged.braille,
        auth: {
          mode: "authenticated",
          user: {
            id: userId,
            email: demoEmail,
            displayName: demoName,
            avatarId: "owli",
            isDemo: true,
          },
          source: "supabase",
          syncing: false,
        },
      });

      void syncToSupabaseIfActive(current()).then(() => this.refreshLeaderboard());
      return { ok: true };
    },

    setAvatar(avatarId: string) {
      const p = current();
      const updatedUser = p.auth.user ? { ...p.auth.user, avatarId } : null;
      commit({
        ...p,
        settings: { ...p.settings, avatarId },
        auth: { ...p.auth, user: updatedUser },
      });
    },

    async logout() {
      const p = current();
      if (activeAccessToken) {
        void supabaseSignOut(activeAccessToken);
      }
      activeAccessToken = undefined;

      let guestBisindo = DEFAULT_PROGRESS.bisindo;
      let guestBraille = DEFAULT_PROGRESS.braille;

      if (typeof window !== "undefined") {
        try {
          window.localStorage.removeItem(SESSION_KEY);
          const rawGuest = window.localStorage.getItem(GUEST_KEY);
          if (rawGuest) {
            const parsed = JSON.parse(rawGuest);
            guestBisindo = { ...DEFAULT_PROGRESS.bisindo, ...parsed.bisindo };
            guestBraille = { ...DEFAULT_PROGRESS.braille, ...parsed.braille };
          }
        } catch {
          // Gunakan default jika kosong
        }
      }

      commit(
        {
          ...DEFAULT_PROGRESS,
          settings: p.settings,
          bisindo: guestBisindo,
          braille: guestBraille,
          auth: {
            mode: "guest",
            user: null,
            source: "local",
            syncing: false,
          },
        },
        false
      );
    },

    async refreshLeaderboard() {
      if (!isSupabaseConfigured()) return;
      const rows = await fetchSupabaseLeaderboard(10, activeAccessToken);
      if (!rows) return;
      remoteLeaderboardCache = rows.map((r) => ({
        id: r.id,
        displayName: r.display_name,
        avatarId: r.progress_data?.avatarId || "owli",
        xp: r.xp,
        streakCurrent: r.streak_current,
        badgeCount: Array.isArray(r.badges) ? r.badges.length : 0,
      }));
      const p = current();
      commit({ ...p }, false);
    },
  },
};
