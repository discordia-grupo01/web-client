import { LOADING_SCREEN } from "@discordia/client-shared";

import { useEffect, useState } from "react";

type Phase = "waiting" | "loading" | "leaving" | "done";

const { showDelayMs, minVisibleMs, fadeOutMs } = LOADING_SCREEN;

/**
 * Evita el destello de una pantalla de carga: no aparece si todo estaba
 * listo antes de `showDelayMs`, y una vez visible dura al menos
 * `minVisibleMs` y se desvanece en vez de cortarse.
 */
export function useLoadingGate(isReady: boolean): Phase {
  const [delayElapsed, setDelayElapsed] = useState(false);
  const [minElapsed, setMinElapsed] = useState(false);
  const [faded, setFaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDelayElapsed(true), showDelayMs);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!delayElapsed) return;
    const timer = setTimeout(() => setMinElapsed(true), minVisibleMs);
    return () => clearTimeout(timer);
  }, [delayElapsed]);

  const isLeaving = delayElapsed && minElapsed && isReady;
  useEffect(() => {
    if (!isLeaving) return;
    const timer = setTimeout(() => setFaded(true), fadeOutMs);
    return () => clearTimeout(timer);
  }, [isLeaving]);

  if (!delayElapsed) return isReady ? "done" : "waiting";
  if (faded) return "done";
  return isLeaving ? "leaving" : "loading";
}
