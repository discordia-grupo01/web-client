import { useSyncExternalStore } from "react";

const TICK_MS = 1000;

/**
 * Un solo intervalo para toda la pagina, aunque haya varias llamadas en curso:
 * arranca con el primer componente que lo usa y se apaga con el ultimo.
 */
let now = Date.now();
let timer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (timer === null) {
    timer = setInterval(() => {
      now = Date.now();
      listeners.forEach((notify) => notify());
    }, TICK_MS);
  }
  // Sin intervalo corriendo, `now` puede ser viejo: se pone al dia ya.
  now = Date.now();
  listener();

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };
}

const getSnapshot = () => now;
const getServerSnapshot = () => null;

/** La hora actual en ms, al dia cada segundo. `null` en el render del server. */
export function useNow(): number | null {
  return useSyncExternalStore<number | null>(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
}
