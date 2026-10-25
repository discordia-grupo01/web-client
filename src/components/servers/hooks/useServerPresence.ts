"use client";

import {
  type PresenceStore,
  watchServerPresence,
} from "@discordia/client-shared";
import { useEffect } from "react";

import { acquireSocket } from "@/services/messages/socket";

/** Mientras el servidor esta abierto, sigue el estado de sus miembros (`presence:<server>`). */
export function useServerPresence(
  store: PresenceStore,
  serverId: string | null,
) {
  useEffect(() => {
    if (!serverId) return;
    return watchServerPresence(acquireSocket, store, serverId);
  }, [serverId, store]);
}
