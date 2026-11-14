export const ONE_HAND = ["C", "E", "I", "J", "L", "O", "R", "U", "V", "Z"];

export const UNITS = [
  { id: 1, title: "Unit 1: Vokal", color: "bg-sun", letters: ["A", "E", "I", "O", "U"] },
  { id: 2, title: "Unit 2: Isyarat 1 Tangan", color: "bg-mint", letters: ["C", "J", "L", "R", "V", "Z"] },
  { id: 3, title: "Unit 3: Isyarat 2 Tangan Dasar", color: "bg-coral", letters: ["B", "D", "F", "H", "K", "T", "W", "X"] },
  { id: 4, title: "Unit 4: Isyarat 2 Tangan Lanjutan", color: "bg-sky", letters: ["G", "M", "N", "P", "Q", "S", "Y"] },
];

export const handsOf = (l: string) => (ONE_HAND.includes(l) ? 1 : 2);

export interface WordItem {
  id: string;
  title: string;
  hands: 1 | 2;
  guide: string;
}

export const WORD_ITEMS: WordItem[] = [
  {
    id: "air",
    title: "Air",
    hands: 1,
    guide: "Bentuk tangan menghadap ke depan lalu gerakkan perlahan di dekat mulut seolah minum air.",
  },
  {
    id: "belajar",
    title: "Belajar",
    hands: 2,
    guide: "Buka satu telapak tangan sebagai buku lalu gerakkan jari tangan lain dari telapak ke arah dahi.",
  },
  {
    id: "hari",
    title: "Hari",
    hands: 1,
    guide: "Angkat jari telunjuk ke atas lalu gerakkan melengkung ke samping mengikuti arah matahari.",
  },
  {
    id: "maaf",
    title: "Maaf",
    hands: 2,
    guide: "Tempelkan kedua ujung telapak tangan di depan dada lalu gerakkan sedikit ke depan.",
  },
  {
    id: "makan",
    title: "Makan",
    hands: 1,
    guide: "Kuncupkan jari-jari tangan kanan lalu arahkan berulang kali mendekati mulut.",
  },
  {
    id: "saya",
    title: "Saya",
    hands: 1,
    guide: "Buka atau arahkan tangan kanan menunjuk langsung ke tengah dada sendiri.",
  },
  {
    id: "terima_kasih",
    title: "Terima Kasih",
    hands: 2,
    guide: "Sentuh area dagu dengan jari lalu ayunkan tangan ke depan ke arah lawan bicara.",
  },
  {
    id: "tuli",
    title: "Tuli",
    hands: 1,
    guide: "Arahkan jari telunjuk menyentuh area telinga lalu gerakkan perlahan menuju sudut mulut.",
  },
];
