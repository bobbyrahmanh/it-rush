import { ONE_HAND, WORD_ITEMS } from "@/lib/bisindo";

export interface BadgeInput {
  xp: number;
  streak: { current: number; longest: number };
  bisindo: {
    learnedLetters: string[];
    learnedWords: string[];
    practiceSessionsCompleted: number;
    guessTheSignBestScore: number;
  };
  braille: {
    learnedLetters: string[];
    quizSessionsCompleted: number;
  };
}

export interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  requirementText: string;
  color: string;
  iconName: "flag" | "book" | "layers" | "message" | "grid" | "eye" | "zap" | "award";
  evaluate: (data: BadgeInput) => { unlocked: boolean; current: number; target: number };
}

const VOWELS = ["A", "E", "I", "O", "U"];

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: "first_step",
    title: "Langkah Pertama",
    description: "Memulai perjalanan komunikasi inklusif dengan menguasai huruf pertamamu.",
    requirementText: "Pelajari minimal 1 huruf BISINDO atau Braille",
    color: "bg-sun",
    iconName: "flag",
    evaluate: (data) => {
      const total = data.bisindo.learnedLetters.length + data.braille.learnedLetters.length;
      return { unlocked: total >= 1, current: Math.min(total, 1), target: 1 };
    },
  },
  {
    id: "vowel_master",
    title: "Master Vokal",
    description: "Menguasai seluruh lima huruf vokal dasar (A, E, I, O, U) dalam BISINDO.",
    requirementText: "Kuasi 5 huruf vokal BISINDO (Unit 1)",
    color: "bg-mint",
    iconName: "book",
    evaluate: (data) => {
      const count = VOWELS.filter((v) => data.bisindo.learnedLetters.includes(v)).length;
      return { unlocked: count >= 5, current: count, target: 5 };
    },
  },
  {
    id: "two_hand_pro",
    title: "Dua Tangan Tangguh",
    description: "Terampil mengoordinasikan kedua tangan untuk membentuk alfabet BISINDO.",
    requirementText: "Kuasi minimal 5 huruf BISINDO dua tangan",
    color: "bg-coral",
    iconName: "layers",
    evaluate: (data) => {
      const twoHandLearned = data.bisindo.learnedLetters.filter((l) => !ONE_HAND.includes(l)).length;
      return { unlocked: twoHandLearned >= 5, current: Math.min(twoHandLearned, 5), target: 5 };
    },
  },
  {
    id: "word_explorer",
    title: "Penjelajah Kosakata",
    description: "Melangkah lebih jauh dari sekadar ejaan jari menuju kosakata gerakan dinamis.",
    requirementText: `Kuasi minimal 3 dari ${WORD_ITEMS.length} kosakata dinamis BISINDO`,
    color: "bg-sky",
    iconName: "message",
    evaluate: (data) => {
      const words = (data.bisindo.learnedWords ?? []).length;
      return { unlocked: words >= 3, current: Math.min(words, 3), target: 3 };
    },
  },
  {
    id: "braille_reader",
    title: "Sahabat Braille",
    description: "Memahami logika matriks 6 titik Braille dan menuntaskan latihan kuis.",
    requirementText: "Kuasi 10 huruf Braille dan selesaikan 1 sesi kuis Braille",
    color: "bg-mint",
    iconName: "grid",
    evaluate: (data) => {
      const letters = Math.min(data.braille.learnedLetters.length, 10);
      const quiz = Math.min(data.braille.quizSessionsCompleted, 1);
      const current = letters + quiz;
      return { unlocked: letters >= 10 && quiz >= 1, current, target: 11 };
    },
  },
  {
    id: "sharp_observer",
    title: "Pengamat Tajam",
    description: "Mampu mengenali bentuk isyarat tangan BISINDO secara cepat dan akurat.",
    requirementText: "Raih skor terbaik minimal 80% pada Guess the Sign",
    color: "bg-sun",
    iconName: "eye",
    evaluate: (data) => {
      const best = data.bisindo.guessTheSignBestScore ?? 0;
      return { unlocked: best >= 80, current: Math.min(best, 80), target: 80 };
    },
  },
  {
    id: "streak_guardian",
    title: "Penjaga Konsistensi",
    description: "Berlatih secara rutin lintas hari untuk menjaga daya ingat komunikasi inklusif.",
    requirementText: "Capai rentetan belajar (streak) minimal 3 hari",
    color: "bg-coral",
    iconName: "zap",
    evaluate: (data) => {
      const bestStreak = Math.max(data.streak.current, data.streak.longest);
      return { unlocked: bestStreak >= 3, current: Math.min(bestStreak, 3), target: 3 };
    },
  },
  {
    id: "inclusive_hero",
    title: "Duta Inklusif",
    description: "Menuntaskan seluruh 26 alfabet lengkap pada modul BISINDO atau modul Braille.",
    requirementText: "Kuasi 26 huruf BISINDO atau 26 huruf Braille penuh",
    color: "bg-grape",
    iconName: "award",
    evaluate: (data) => {
      const maxMastered = Math.max(
        data.bisindo.learnedLetters.length,
        data.braille.learnedLetters.length
      );
      return { unlocked: maxMastered >= 26, current: Math.min(maxMastered, 26), target: 26 };
    },
  },
];

export function evaluateBadges(data: BadgeInput): string[] {
  return BADGE_DEFINITIONS.filter((b) => b.evaluate(data).unlocked).map((b) => b.id);
}
