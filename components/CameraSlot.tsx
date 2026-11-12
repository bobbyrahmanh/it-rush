"use client";
// Slot kamera: diganti komponen CV (VideoInputProvider + MediaPipe + TF.js) oleh Role 1 dan 2.
export default function CameraSlot({ letter }: { letter: string }) {
  return (
    <div className="card flex min-h-[320px] flex-col items-center justify-center gap-4 bg-ink p-6 text-center text-white">
      <p className="font-display text-xl font-semibold">Area kamera untuk huruf {letter}</p>
      <p className="max-w-sm text-white/90">Video diproses di perangkatmu dan tidak dikirim ke server mana pun.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <button className="btn bg-sun text-ink" disabled>Gunakan Kamera</button>
        <button className="btn bg-white text-ink" disabled>Gunakan Video Simulasi</button>
      </div>
      <p className="text-sm text-white/80">Mesin deteksi tangan akan dipasang di slot ini oleh modul computer vision.</p>
    </div>
  );
}
