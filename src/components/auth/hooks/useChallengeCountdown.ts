"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Segundos que le quedan al challenge del segundo paso del login. Se cuenta
 * contra una hora límite fija, así el tiempo no se corre aunque el navegador
 * frene los intervalos de una pestaña en segundo plano.
 */
export function useChallengeCountdown(
  expiresIn: number,
  onExpired: () => void,
  running = true,
): number {
  const [deadline] = useState(() => Date.now() + expiresIn * 1000);
  const [secondsLeft, setSecondsLeft] = useState(Math.max(0, expiresIn));
  const onExpiredRef = useRef(onExpired);

  useEffect(() => {
    onExpiredRef.current = onExpired;
  }, [onExpired]);

  useEffect(() => {
    if (!running) return;

    function remaining(): number {
      return Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    }

    if (remaining() === 0) {
      onExpiredRef.current();
      return;
    }

    const interval = window.setInterval(() => {
      const left = remaining();
      setSecondsLeft(left);
      if (left === 0) {
        window.clearInterval(interval);
        onExpiredRef.current();
      }
    }, 1000);
    return () => window.clearInterval(interval);
  }, [deadline, running]);

  return secondsLeft;
}
