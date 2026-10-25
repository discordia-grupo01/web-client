"use client";

import {
  createIdleTracker,
  type IdleTracker,
  type PresenceStore,
  reportActivity,
  type UserRoomPush,
} from "@discordia/client-shared";
import { useEffect, useRef } from "react";

import { usePresenceSelector } from "./PresenceContext";

/** Lo que cuenta como "estar usando la app". Una pestaña oculta no genera ninguno. */
const ACTIVITY_EVENTS = [
  "pointermove",
  "pointerdown",
  "keydown",
  "wheel",
  "touchstart",
  "scroll",
] as const;

export function useIdleReporter(store: PresenceStore, push: UserRoomPush) {
  const idleAfterMs = usePresenceSelector(store, (state) => state.idleAfterMs);
  const joins = usePresenceSelector(store, (state) => state.userRoomJoins);
  const trackerRef = useRef<IdleTracker | null>(null);

  useEffect(() => {
    const tracker = createIdleTracker({
      idleAfterMs,
      onChange: (idle) => void reportActivity(push, idle),
    });
    trackerRef.current = tracker;
    const onActivity = () => tracker.activity();
    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, onActivity, {
        capture: true,
        passive: true,
      });
    }
    return () => {
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, onActivity, { capture: true });
      }
      tracker.stop();
      // El tracker que lo reemplaza arranca activo: el back tiene que saberlo.
      if (tracker.isIdle()) void reportActivity(push, false);
    };
  }, [idleAfterMs, push]);

  useEffect(() => {
    if (joins > 0 && trackerRef.current?.isIdle()) {
      void reportActivity(push, true);
    }
  }, [joins, push]);
}
