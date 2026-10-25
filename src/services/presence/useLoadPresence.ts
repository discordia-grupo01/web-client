"use client";

import { loadPresence, type PresenceStore } from "@discordia/client-shared";
import { useEffect } from "react";

import { listPresenceRequest } from "./client";
import { usePresenceSelector } from "./PresenceContext";

/**
 * Pide por REST el estado de `userIds` (contactos de DM, un perfil abierto).
 * Se repite al re-unirse la sala personal, por si algo cambio durante el corte.
 */
export function useLoadPresence(
  store: PresenceStore,
  userIds: readonly string[],
) {
  const joins = usePresenceSelector(store, (state) => state.userRoomJoins);
  const key = [...new Set(userIds)].sort().join(",");

  useEffect(() => {
    if (!key) return;
    void loadPresence(store, key.split(","), listPresenceRequest);
  }, [store, key, joins]);
}
