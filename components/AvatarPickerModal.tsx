"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Smile, X } from "react-feather";
import { AVATARS, AvatarDefinition } from "@/lib/avatars";
import UserAvatar from "./UserAvatar";

interface AvatarPickerModalProps {
  isOpen: boolean;
  currentAvatarId?: string | null;
  onClose: () => void;
  onSelect: (avatarId: string) => void;
}

export default function AvatarPickerModal({
  isOpen,
  currentAvatarId = "owli",
  onClose,
  onSelect,
}: AvatarPickerModalProps) {
  const [selectedId, setSelectedId] = useState<string>(currentAvatarId || "owli");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSelectedId(currentAvatarId || "owli");
    }
  }, [isOpen, currentAvatarId]);

  // Kunci scroll halaman saat modal aktif
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  function handleSave(idToSave?: string) {
    const finalId = idToSave || selectedId;
    onSelect(finalId);
    onClose();
  }

  const activeAvatar = AVATARS.find((a) => a.id === selectedId) || AVATARS[0];

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="avatar-modal-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-ink/75 backdrop-blur-sm"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        className="relative my-auto w-full max-w-lg rounded-3xl border-4 border-ink bg-white p-4 sm:p-6 shadow-pop flex flex-col animate-pop"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal Ringkas */}
        <div className="flex items-center justify-between border-b-2 border-ink/15 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-ink bg-sun text-ink shadow-popsm">
              <Smile className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2
                id="avatar-modal-title"
                className="font-display text-xl font-bold leading-tight text-ink sm:text-2xl"
              >
                Pilih Avatar Profil
              </h2>
              <p className="text-[11px] text-ink/75 sm:text-xs">
                Pilih karakter untuk foto profil dan papan peringkatmu.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup pemilih avatar"
            className="btn !min-h-[36px] !min-w-[36px] !p-1.5 bg-paper text-ink hover:bg-coral hover:text-white"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Grid 6 Karakter Avatar - Selalu terlihat utuh di layar */}
        <div className="mt-3.5 grid grid-cols-3 gap-2.5 sm:gap-3">
          {AVATARS.map((avatar: AvatarDefinition) => {
            const isSelected = selectedId === avatar.id;
            return (
              <button
                key={avatar.id}
                type="button"
                onClick={() => setSelectedId(avatar.id)}
                onDoubleClick={() => handleSave(avatar.id)}
                title={`Pilih ${avatar.name} (Klik dua kali untuk langsung pasang)`}
                className={`group relative flex flex-col items-center rounded-2xl border-2 sm:border-4 p-2 sm:p-2.5 text-center transition-all ${
                  isSelected
                    ? "border-ink bg-sun/40 shadow-popsm -translate-y-0.5"
                    : "border-ink/20 bg-paper hover:border-ink hover:bg-white"
                }`}
              >
                {isSelected && (
                  <span className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-ink bg-mint text-ink">
                    <Check className="h-3 w-3 stroke-[3]" aria-hidden="true" />
                  </span>
                )}

                <UserAvatar
                  avatarId={avatar.id}
                  size="md"
                  className="transition group-hover:scale-105"
                />

                <p className="mt-1.5 font-display text-xs sm:text-sm font-bold text-ink leading-tight">
                  {avatar.name.split(" ")[0]}
                </p>
                <p className="text-[10px] text-ink/70 leading-tight hidden sm:block">
                  {avatar.name.split(" ").slice(1).join(" ")}
                </p>
              </button>
            );
          })}
        </div>

        {/* Deskripsi Karakter & Tombol Simpan */}
        <div className="mt-4 flex flex-col gap-3 border-t-2 border-ink/15 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="rounded-xl border border-ink/20 bg-paper px-3 py-1.5 text-[11px] leading-relaxed text-ink/85 sm:max-w-[270px]">
            <span className="font-bold text-ink">{activeAvatar.name}</span>:{" "}
            {activeAvatar.description}
          </div>

          <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="btn !min-h-[40px] flex-1 sm:flex-initial justify-center !px-3.5 bg-paper text-xs text-ink"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => handleSave()}
              className="btn !min-h-[40px] flex-1 sm:flex-initial justify-center !px-4 bg-sun text-xs font-bold text-ink shadow-popsm"
            >
              Gunakan Avatar Ini
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
