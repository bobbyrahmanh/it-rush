// Titik 1..6 -> indeks 0..5 (kiri atas-bawah: 1,2,3 | kanan atas-bawah: 4,5,6)
const DOTS: Record<string, number[]> = {
  A: [1], B: [1, 2], C: [1, 4], D: [1, 4, 5], E: [1, 5], F: [1, 2, 4], G: [1, 2, 4, 5], H: [1, 2, 5], I: [2, 4], J: [2, 4, 5],
  K: [1, 3], L: [1, 2, 3], M: [1, 3, 4], N: [1, 3, 4, 5], O: [1, 3, 5], P: [1, 2, 3, 4], Q: [1, 2, 3, 4, 5], R: [1, 2, 3, 5], S: [2, 3, 4], T: [2, 3, 4, 5],
  U: [1, 3, 6], V: [1, 2, 3, 6], W: [2, 4, 5, 6], X: [1, 3, 4, 6], Y: [1, 3, 4, 5, 6], Z: [1, 3, 5, 6],
};

export const LETTERS = Object.keys(DOTS);
export const KEY_TO_DOT: Record<string, number> = { f: 0, d: 1, s: 2, j: 3, k: 4, l: 5 };
export const DOT_KEYS = ["F", "D", "S", "J", "K", "L"];

export const patternOf = (letter: string): boolean[] =>
  Array.from({ length: 6 }, (_, i) => DOTS[letter].includes(i + 1));

export const letterFrom = (dots: boolean[]): string | null =>
  LETTERS.find((l) => patternOf(l).every((v, i) => v === dots[i])) ?? null;
