"use client";

import {
  type ActivityStatus,
  displayedPresenceOf,
  type PresenceState,
  type PresenceStore,
} from "@discordia/client-shared";
import { useSyncExternalStore } from "react";

import { usePresenceContext } from "@/contexts/PresenceContext";

/** Lee una parte del estado de actividad y re-renderiza solo si esa parte cambia. */
export function usePresenceSelector<T>(
  store: PresenceStore,
  select: (state: PresenceState) => T,
): T {
  const read = () => select(store.getState());
  return useSyncExternalStore(store.subscribe, read, read);
}

/** El estado que se muestra de alguien (el propio sale de lo que elegiste). */
export function usePresenceOf(
  userId: string | null | undefined,
): ActivityStatus {
  const { store } = usePresenceContext();
  return usePresenceSelector(store, (state) =>
    userId ? displayedPresenceOf(state, userId) : "offline",
  );
}

/** Tu eleccion (`null` hasta que se une la sala personal) y como cambiarla. */
export function useOwnStatus() {
  const { store, setOwnStatus } = usePresenceContext();
  const choice = usePresenceSelector(store, (state) => state.ownChoice);
  return { choice, setOwnStatus };
}
