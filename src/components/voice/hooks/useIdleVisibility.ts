import { useCallback, useEffect, useRef, useState } from "react";

export const IDLE_HIDE_MS = 3000;

export function useIdleVisibility(isEnabled: boolean, idleMs = IDLE_HIDE_MS) {
  const [isIdle, setIsIdle] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onActivity = useCallback(() => {
    if (!isEnabled) return;
    setIsIdle(false);
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setIsIdle(true), idleMs);
  }, [isEnabled, idleMs]);

  useEffect(() => {
    setIsIdle(false);
    onActivity();
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [onActivity]);

  return { isVisible: !isEnabled || !isIdle, onActivity };
}
