"use client";

import { useEffect, useRef, useState } from "react";

const LONG_PRESS_MS = 300;
const MOVE_TOLERANCE_PX = 10;

export function useLongPress(onLongPress: () => void, enabled: boolean) {
  const [isPressing, setIsPressing] = useState(false);
  const timerRef = useRef<number | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const hasFiredRef = useRef(false);
  const isTouchRef = useRef(false);

  function cancel() {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    startRef.current = null;
    setIsPressing(false);
  }

  useEffect(() => cancel, []);

  if (!enabled) return { isPressing: false, handlers: {} };

  return {
    isPressing,
    handlers: {
      onPointerDown(event: React.PointerEvent) {
        isTouchRef.current = event.pointerType === "touch";
        if (!isTouchRef.current) return;
        hasFiredRef.current = false;
        startRef.current = { x: event.clientX, y: event.clientY };
        setIsPressing(true);
        timerRef.current = window.setTimeout(() => {
          hasFiredRef.current = true;
          cancel();
          onLongPress();
        }, LONG_PRESS_MS);
      },
      onPointerMove(event: React.PointerEvent) {
        const start = startRef.current;
        if (!start) return;
        const moved = Math.hypot(
          event.clientX - start.x,
          event.clientY - start.y,
        );
        if (moved > MOVE_TOLERANCE_PX) cancel();
      },
      onPointerUp: cancel,
      onPointerCancel: cancel,
      onTouchEnd(event: React.TouchEvent) {
        if (!hasFiredRef.current) return;
        hasFiredRef.current = false;
        event.preventDefault();
      },
      onContextMenu(event: React.MouseEvent) {
        if (isTouchRef.current) event.preventDefault();
      },
    },
  };
}
