export interface AvatarDefinition {
  id: string;
  name: string;
  description: string;
  bgColor: string;
  borderColor: string;
}

export const AVATARS: AvatarDefinition[] = [
  {
    id: "owli",
    name: "Owli si Burung Hantu",
    description: "Maskot utama SIGNIFY, bijak dan peka terhadap bahasa isyarat & Braille.",
    bgColor: "#5B4BDB",
    borderColor: "#1B1B3A",
  },
  {
    id: "kucing",
    name: "Miko si Kucing Ceria",
    description: "Ceria, ramah, dan selalu antusias belajar kosakata baru setiap hari.",
    bgColor: "#FFC93C",
    borderColor: "#1B1B3A",
  },
  {
    id: "panda",
    name: "Bubu si Panda Lembut",
    description: "Tenang, teliti, dan tekun meraba pola titik-titik simulator Braille.",
    bgColor: "#19B5A5",
    borderColor: "#1B1B3A",
  },
  {
    id: "rubah",
    name: "Kiko si Rubah Lincah",
    description: "Energik dan cekatan dalam mengenali gesture tangan BISINDO.",
    bgColor: "#FF5D73",
    borderColor: "#1B1B3A",
  },
  {
    id: "kelinci",
    name: "Pompom si Kelinci Tangkas",
    description: "Punya pendengaran tajam dan gemar mengejar rekor kuis.",
    bgColor: "#DDF3FF",
    borderColor: "#1B1B3A",
  },
  {
    id: "beruang",
    name: "Bara si Beruang Hangat",
    description: "Setia kawan, penyabar, dan selalu menyemangati teman satu leaderboard.",
    bgColor: "#8B72E8",
    borderColor: "#1B1B3A",
  },
];

export const DEFAULT_AVATAR_ID = "owli";

export function getAvatarById(id?: string | null): AvatarDefinition {
  if (!id) return AVATARS[0];
  return AVATARS.find((a) => a.id === id) ?? AVATARS[0];
}
