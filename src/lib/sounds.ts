export const SOUNDS = {
  DISCONNECT: "/sounds/desconectar.mp3",
  CALL_REJECTED: "/sounds/llamada-rechazada.mp3",
} as const;

export function playSound(url: string): void {
  if (typeof Audio === "undefined") return;
  try {
    const audio = new Audio(url);
    void audio.play().catch(() => undefined);
  } catch {}
}
