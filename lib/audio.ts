export function speak(text: string, enabled: boolean) {
  try {
    if (!enabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "id-ID";
    window.speechSynthesis.speak(u);
  } catch {
    /* teks visual tetap menjadi umpan balik utama */
  }
}
