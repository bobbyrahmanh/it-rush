"use client";

import { getAvatarById } from "@/lib/avatars";

interface UserAvatarProps {
  avatarId?: string | null;
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  alt?: string;
}

const SIZE_CLASSES = {
  xs: "h-6 w-6 border",
  sm: "h-8 w-8 border-2",
  md: "h-11 w-11 border-2",
  lg: "h-16 w-16 border-4",
  xl: "h-20 w-20 border-4",
};

export default function UserAvatar({
  avatarId,
  className = "",
  size = "md",
  alt,
}: UserAvatarProps) {
  const avatar = getAvatarById(avatarId);
  const sizeClass = SIZE_CLASSES[size] ?? SIZE_CLASSES.md;

  return (
    <div
      role="img"
      aria-label={alt ?? avatar.name}
      title={avatar.name}
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border-ink shadow-popsm select-none ${sizeClass} ${className}`}
      style={{ backgroundColor: avatar.bgColor }}
    >
      <svg
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full"
      >
        {avatar.id === "owli" && (
          <g>
            {/* Telinga / jambul Owli */}
            <polygon points="22,35 15,10 38,24" fill="#7259D1" stroke="#1B1B3A" strokeWidth="3" />
            <polygon points="78,35 85,10 62,24" fill="#7259D1" stroke="#1B1B3A" strokeWidth="3" />
            {/* Kepala Owli */}
            <circle cx="50" cy="54" r="38" fill="#8B72E8" stroke="#1B1B3A" strokeWidth="4" />
            {/* Lingkar mata putih */}
            <circle cx="36" cy="46" r="17" fill="#FFF5DF" stroke="#1B1B3A" strokeWidth="3" />
            <circle cx="64" cy="46" r="17" fill="#FFF5DF" stroke="#1B1B3A" strokeWidth="3" />
            {/* Cincin kuning */}
            <circle cx="36" cy="46" r="11" fill="#FFC93C" stroke="#5B4BDB" strokeWidth="2.5" />
            <circle cx="64" cy="46" r="11" fill="#FFC93C" stroke="#5B4BDB" strokeWidth="2.5" />
            {/* Pupil */}
            <circle cx="37" cy="46" r="6.5" fill="#1B1B3A" />
            <circle cx="39" cy="44" r="2.5" fill="white" />
            <circle cx="65" cy="46" r="6.5" fill="#1B1B3A" />
            <circle cx="67" cy="44" r="2.5" fill="white" />
            {/* Paruh */}
            <polygon points="46,55 54,55 50,65" fill="#FFB84D" stroke="#1B1B3A" strokeWidth="2.5" strokeLinejoin="round" />
            {/* Titik Braille di dada */}
            <circle cx="43" cy="78" r="2.5" fill="#FFF5DF" stroke="#1B1B3A" strokeWidth="1.5" />
            <circle cx="57" cy="78" r="2.5" fill="#FFF5DF" stroke="#1B1B3A" strokeWidth="1.5" />
            <circle cx="43" cy="85" r="2.5" fill="#FFC93C" stroke="#1B1B3A" strokeWidth="1.5" />
            <circle cx="57" cy="85" r="2.5" fill="#FFF5DF" stroke="#1B1B3A" strokeWidth="1.5" />
          </g>
        )}

        {avatar.id === "kucing" && (
          <g>
            {/* Telinga Kucing */}
            <polygon points="18,42 16,14 42,28" fill="#FFB84D" stroke="#1B1B3A" strokeWidth="3" strokeLinejoin="round" />
            <polygon points="22,38 20,20 36,29" fill="#FF8D9B" />
            <polygon points="82,42 84,14 58,28" fill="#FFB84D" stroke="#1B1B3A" strokeWidth="3" strokeLinejoin="round" />
            <polygon points="78,38 80,20 64,29" fill="#FF8D9B" />
            {/* Kepala */}
            <circle cx="50" cy="56" r="36" fill="#FFC93C" stroke="#1B1B3A" strokeWidth="4" />
            {/* Pipi */}
            <ellipse cx="28" cy="65" rx="6" ry="4" fill="#FF8D9B" opacity="0.8" />
            <ellipse cx="72" cy="65" rx="6" ry="4" fill="#FF8D9B" opacity="0.8" />
            {/* Mata bulat */}
            <circle cx="36" cy="50" r="6" fill="#1B1B3A" />
            <circle cx="38" cy="48" r="2.5" fill="white" />
            <circle cx="64" cy="50" r="6" fill="#1B1B3A" />
            <circle cx="66" cy="48" r="2.5" fill="white" />
            {/* Hidung & mulut */}
            <polygon points="48,60 52,60 50,63" fill="#FF5D73" stroke="#1B1B3A" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M46,65 Q50,68 50,64 Q50,68 54,65" fill="none" stroke="#1B1B3A" strokeWidth="2.5" strokeLinecap="round" />
            {/* Kumis */}
            <line x1="20" y1="58" x2="30" y2="60" stroke="#1B1B3A" strokeWidth="2" strokeLinecap="round" />
            <line x1="20" y1="65" x2="30" y2="64" stroke="#1B1B3A" strokeWidth="2" strokeLinecap="round" />
            <line x1="80" y1="58" x2="70" y2="60" stroke="#1B1B3A" strokeWidth="2" strokeLinecap="round" />
            <line x1="80" y1="65" x2="70" y2="64" stroke="#1B1B3A" strokeWidth="2" strokeLinecap="round" />
          </g>
        )}

        {avatar.id === "panda" && (
          <g>
            {/* Telinga Panda Hitam */}
            <circle cx="24" cy="25" r="14" fill="#1B1B3A" stroke="#1B1B3A" strokeWidth="3" />
            <circle cx="76" cy="25" r="14" fill="#1B1B3A" stroke="#1B1B3A" strokeWidth="3" />
            {/* Kepala Putih */}
            <circle cx="50" cy="56" r="37" fill="#FFFFFF" stroke="#1B1B3A" strokeWidth="4" />
            {/* Lingkaran hitam mata khas panda */}
            <ellipse cx="34" cy="52" rx="11" ry="14" transform="rotate(-15 34 52)" fill="#1B1B3A" />
            <ellipse cx="66" cy="52" rx="11" ry="14" transform="rotate(15 66 52)" fill="#1B1B3A" />
            {/* Bola mata putih bersinar */}
            <circle cx="34" cy="52" r="4.5" fill="white" />
            <circle cx="35" cy="51" r="2" fill="#1B1B3A" />
            <circle cx="66" cy="52" r="4.5" fill="white" />
            <circle cx="65" cy="51" r="2" fill="#1B1B3A" />
            {/* Pipi pink manis */}
            <ellipse cx="23" cy="65" rx="5" ry="3.5" fill="#FF8D9B" opacity="0.85" />
            <ellipse cx="77" cy="65" rx="5" ry="3.5" fill="#FF8D9B" opacity="0.85" />
            {/* Hidung & mulut */}
            <ellipse cx="50" cy="64" rx="5.5" ry="3.5" fill="#1B1B3A" />
            <path d="M47,68 Q50,72 53,68" fill="none" stroke="#1B1B3A" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        )}

        {avatar.id === "rubah" && (
          <g>
            {/* Telinga Rubah */}
            <polygon points="18,44 14,10 44,26" fill="#FF5D73" stroke="#1B1B3A" strokeWidth="3" strokeLinejoin="round" />
            <polygon points="22,38 18,17 38,28" fill="#FFF5DF" />
            <polygon points="82,44 86,10 56,26" fill="#FF5D73" stroke="#1B1B3A" strokeWidth="3" strokeLinejoin="round" />
            <polygon points="78,38 82,17 62,28" fill="#FFF5DF" />
            {/* Kepala Rubah */}
            <circle cx="50" cy="56" r="36" fill="#FF6B7F" stroke="#1B1B3A" strokeWidth="4" />
            {/* Pipi Putih */}
            <path d="M22,60 Q34,75 50,75 Q66,75 78,60 C78,78 66,88 50,88 C34,88 22,78 22,60 Z" fill="#FFF5DF" stroke="#1B1B3A" strokeWidth="2.5" strokeLinejoin="round" />
            {/* Mata Rubah */}
            <ellipse cx="35" cy="50" rx="5" ry="6" fill="#1B1B3A" />
            <circle cx="37" cy="48" r="2" fill="white" />
            <ellipse cx="65" cy="50" rx="5" ry="6" fill="#1B1B3A" />
            <circle cx="67" cy="48" r="2" fill="white" />
            {/* Hidung tombol hitam */}
            <polygon points="46,67 54,67 50,72" fill="#1B1B3A" stroke="#1B1B3A" strokeWidth="1.5" strokeLinejoin="round" />
          </g>
        )}

        {avatar.id === "kelinci" && (
          <g>
            {/* Telinga Kelinci Panjang */}
            <ellipse cx="34" cy="22" rx="9" ry="20" fill="#FFFFFF" stroke="#1B1B3A" strokeWidth="3" />
            <ellipse cx="34" cy="22" rx="4.5" ry="14" fill="#FF8D9B" />
            <ellipse cx="66" cy="22" rx="9" ry="20" fill="#FFFFFF" stroke="#1B1B3A" strokeWidth="3" />
            <ellipse cx="66" cy="22" rx="4.5" ry="14" fill="#FF8D9B" />
            {/* Kepala */}
            <circle cx="50" cy="60" r="34" fill="#FFFFFF" stroke="#1B1B3A" strokeWidth="4" />
            {/* Pipi */}
            <ellipse cx="26" cy="68" rx="5.5" ry="3.5" fill="#FF8D9B" opacity="0.8" />
            <ellipse cx="74" cy="68" rx="5.5" ry="3.5" fill="#FF8D9B" opacity="0.8" />
            {/* Mata */}
            <circle cx="36" cy="55" r="5.5" fill="#1B1B3A" />
            <circle cx="38" cy="53" r="2.2" fill="white" />
            <circle cx="64" cy="55" r="5.5" fill="#1B1B3A" />
            <circle cx="66" cy="53" r="2.2" fill="white" />
            {/* Hidung & mulut kelinci */}
            <polygon points="47,63 53,63 50,67" fill="#FF5D73" stroke="#1B1B3A" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M46,69 Q50,73 50,68 Q50,73 54,69" fill="none" stroke="#1B1B3A" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        )}

        {avatar.id === "beruang" && (
          <g>
            {/* Telinga Beruang */}
            <circle cx="22" cy="30" r="13" fill="#D48B47" stroke="#1B1B3A" strokeWidth="3" />
            <circle cx="22" cy="30" r="6" fill="#F0C392" />
            <circle cx="78" cy="30" r="13" fill="#D48B47" stroke="#1B1B3A" strokeWidth="3" />
            <circle cx="78" cy="30" r="6" fill="#F0C392" />
            {/* Kepala */}
            <circle cx="50" cy="58" r="36" fill="#D48B47" stroke="#1B1B3A" strokeWidth="4" />
            {/* Moncong */}
            <ellipse cx="50" cy="67" rx="16" ry="12" fill="#FDE4C8" stroke="#1B1B3A" strokeWidth="2.5" />
            {/* Hidung besar */}
            <ellipse cx="50" cy="62" rx="7" ry="5" fill="#1B1B3A" />
            <path d="M50,67 L50,72 M46,72 Q50,76 54,72" fill="none" stroke="#1B1B3A" strokeWidth="2.5" strokeLinecap="round" />
            {/* Mata ramah */}
            <circle cx="36" cy="50" r="5" fill="#1B1B3A" />
            <circle cx="38" cy="48" r="2" fill="white" />
            <circle cx="64" cy="50" r="5" fill="#1B1B3A" />
            <circle cx="66" cy="48" r="2" fill="white" />
          </g>
        )}
      </svg>
    </div>
  );
}
