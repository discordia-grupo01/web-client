import { useCallback, useEffect, useRef } from "react";

export const DOUBLE_TAP_MS = 280;

export function useTapOrDoubleTap(
  onTap: (() => void) | undefined,
  onDoubleTap: (() => void) | undefined,
): () => void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbacksRef = useRef({ onTap, onDoubleTap });
  useEffect(() => {
    callbacksRef.current = { onTap, onDoubleTap };
  });

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  return useCallback(() => {
    const { onTap: tap, onDoubleTap: doubleTap } = callbacksRef.current;
    if (!doubleTap) {
      tap?.();
      return;
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      doubleTap();
      return;
    }
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      callbacksRef.current.onTap?.();
    }, DOUBLE_TAP_MS);
  }, []);
}
