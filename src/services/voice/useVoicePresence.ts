"use client";

import {
  VOICE_PARTICIPANTS_POLL_MS,
  type VoicePresenceByChannel,
} from "@discordia/client-shared";

import { useCallback, useEffect, useRef, useState } from "react";

import { listVoiceParticipantsRequest } from "./client";

const EMPTY: VoicePresenceByChannel = {};

/**
 * Quien esta en cada canal de voz de `serverId`, sin estar conectado (#20).
 * Signaling no tiene un socket que el navegador pueda usar, asi que se pide
 * cada `VOICE_PARTICIPANTS_POLL_MS` mientras la pestaña esta a la vista. Si un
 * pedido falla se conserva lo ultimo que llego.
 */
export function useVoicePresence(serverId: string | null): {
  byChannel: VoicePresenceByChannel;
  refresh: () => void;
} {
  const [presence, setPresence] = useState<{
    serverId: string | null;
    byChannel: VoicePresenceByChannel;
  }>({ serverId, byChannel: EMPTY });
  const requestId = useRef(0);

  const refresh = useCallback(() => {
    if (!serverId) return;
    const id = ++requestId.current;
    void listVoiceParticipantsRequest(serverId).then((result) => {
      if (id !== requestId.current || !result.ok) return;
      setPresence({ serverId, byChannel: result.byChannel });
    });
  }, [serverId]);

  useEffect(() => {
    if (!serverId) return;
    refresh();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, VOICE_PARTICIPANTS_POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      requestId.current += 1;
    };
  }, [serverId, refresh]);

  // Lo de otro servidor no se muestra mientras llega lo del nuevo.
  const byChannel = presence.serverId === serverId ? presence.byChannel : EMPTY;
  return { byChannel, refresh };
}
