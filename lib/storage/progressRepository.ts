// Satu-satunya tempat yang boleh menyentuh localStorage. Komponen memakai useProgress().
export type Mod = "bisindo" | "braille";

export interface ProgressData {
  schemaVersion: 1;
  xp: number;
  streak: { current: number; longest: number; lastActiveDate: string | null };
  settings: { audioEnabled: boolean; showLandmarks: boolean };
  bisindo: { learnedLetters: string[]; practiceSessionsCompleted: number; guessTheSignBestScore: number };
  braille: { learnedLetters: string[]; quizSessionsCompleted: number };
}

const KEY = "signify_progress_v1";

export const DEFAULT_PROGRESS: ProgressData = {
  schemaVersion: 1, xp: 0,
  streak: { current: 0, longest: 0, lastActiveDate: null },
  settings: { audioEnabled: true, showLandmarks: true },
  bisindo: { learnedLetters: [], practiceSessionsCompleted: 0, guessTheSignBestScore: 0 },
  braille: { learnedLetters: [], quizSessionsCompleted: 0 },
};

const day = (d: Date) => d.toLocaleDateString("sv-SE");
let cache: ProgressData | null = null;
const listeners = new Set<() => void>();

function load(): ProgressData {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const p = JSON.parse(raw);
    if (p?.schemaVersion !== 1) return DEFAULT_PROGRESS;
    return { ...DEFAULT_PROGRESS, ...p, streak: { ...DEFAULT_PROGRESS.streak, ...p.streak }, settings: { ...DEFAULT_PROGRESS.settings, ...p.settings }, bisindo: { ...DEFAULT_PROGRESS.bisindo, ...p.bisindo }, braille: { ...DEFAULT_PROGRESS.braille, ...p.braille } };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

function commit(next: ProgressData) {
  cache = next;
  try { window.localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* mode privat: tetap jalan di memori */ }
  listeners.forEach((l) => l());
}

const current = () => (cache ??= load());

function withStreak(p: ProgressData): ProgressData {
  const today = day(new Date());
  const last = p.streak.lastActiveDate;
  if (last === today) return p;
  const cur = last === day(new Date(Date.now() - 864e5)) ? p.streak.current + 1 : 1;
  return { ...p, streak: { current: cur, longest: Math.max(cur, p.streak.longest), lastActiveDate: today } };
}

export const progressRepository = {
  subscribe(cb: () => void) { listeners.add(cb); return () => { listeners.delete(cb); }; },
  getSnapshot: () => current(),
  getServerSnapshot: () => DEFAULT_PROGRESS,
  actions: {
    markLearned(mod: Mod, letter: string, xp = 10) {
      const p = current();
      if (p[mod].learnedLetters.includes(letter)) return;
      commit(withStreak({ ...p, xp: p.xp + xp, [mod]: { ...p[mod], learnedLetters: [...p[mod].learnedLetters, letter] } }));
    },
    completeBrailleQuiz(xp = 15) {
      const p = current();
      commit(withStreak({ ...p, xp: p.xp + xp, braille: { ...p.braille, quizSessionsCompleted: p.braille.quizSessionsCompleted + 1 } }));
    },
    setAudio(enabled: boolean) { const p = current(); commit({ ...p, settings: { ...p.settings, audioEnabled: enabled } }); },
    reset() { commit(DEFAULT_PROGRESS); },
  },
};
