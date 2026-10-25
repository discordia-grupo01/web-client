"use client";

import {
  type ActivityStatus,
  type ActivityStatusChoice,
  createPresenceStore,
  displayedPresenceOf,
  type MessageActionResult,
  OWN_STATUS_FAILED,
  type PresenceState,
  type PresenceStore,
} from "@discordia/client-shared";
import { createContext, useContext, useSyncExternalStore } from "react";

export interface PresenceContextValue {
  store: PresenceStore;
  setOwnStatus: (choice: ActivityStatusChoice) => Promise<MessageActionResult>;
}

// Sin proveedor (fuera de la home, o en tests) todos se ven desconectados.
const FALLBACK: PresenceContextValue = {
  store: createPresenceStore(null),
  setOwnStatus: async () => ({ ok: false, message: OWN_STATUS_FAILED }),
};

const PresenceContext = createContext<PresenceContextValue>(FALLBACK);

/** Lo pone `HomeShell`, que es quien tiene la sala personal (`usePresenceSession`). */
export const PresenceProvider = PresenceContext.Provider;

export function usePresenceContext(): PresenceContextValue {
  return useContext(PresenceContext);
}

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
