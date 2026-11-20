export const SOUNDS = {
  DISCONNECT: "/sounds/desconectar.mp3",
  CALL_REJECTED: "/sounds/llamada-rechazada.mp3",
} as const;

const SOUND_VOLUME = 0.5;

const players = new Map<string, HTMLAudioElement>();

function playerFor(url: string): HTMLAudioElement | null {
  if (typeof Audio === "undefined") return null;

  const existing = players.get(url);
  if (existing) return existing;

  try {
    const audio = new Audio(url);
    audio.preload = "auto";
    audio.volume = SOUND_VOLUME;
    players.set(url, audio);
    return audio;
  } catch {
    return null;
  }
}

export function playSound(url: string): void {
  const audio = playerFor(url);
  if (!audio) return;

  try {
    audio.currentTime = 0;
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch((error: unknown) => {
        console.warn("no se pudo reproducir el sonido", url, error);
      });
    }
  } catch (error: unknown) {
    console.warn("no se pudo reproducir el sonido", url, error);
  }
}
