"use client";

import {
  VOICE_PARTICIPANTS_POLL_MS,
  type VoicePresenceByChannel,
  type VoicePresenceParticipant,
} from "@discordia/client-shared";

import { useCallback, useEffect, useRef, useState } from "react";

import { listVoiceParticipantsRequest } from "./client";

const EMPTY: VoicePresenceByChannel = {};

function withoutParticipant(
  byChannel: VoicePresenceByChannel,
  channelId: string,
  identity: string,
): VoicePresenceByChannel {
  const participants = byChannel[channelId];
  if (!participants) return byChannel;
  const rest = participants.filter(
    (participant) => participant.participant_id !== identity,
  );
  if (rest.length === participants.length) return byChannel;
  const result: Record<string, readonly VoicePresenceParticipant[]> = {
    ...byChannel,
  };
  if (rest.length > 0) result[channelId] = rest;
  else delete result[channelId];
  return result;
}

/**
 * Quien esta en cada canal de voz de `serverId`, sin estar conectado (#20).
 * Signaling no tiene un socket que el navegador pueda usar, asi que se pide
 * cada `VOICE_PARTICIPANTS_POLL_MS` mientras la pestaña esta a la vista. Si un
 * pedido falla se conserva lo ultimo que llego.
 *
 * `forget` saca a alguien de un canal sin esperar al back (al salir de la
 * llamada uno ya sabe que no esta) y descarta los pedidos en vuelo, que
 * todavia lo traerian adentro.
 */
export function useVoicePresence(serverId: string | null): {
  byChannel: VoicePresenceByChannel;
  refresh: () => void;
  forget: (channelId: string, identity: string) => void;
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

  const forget = useCallback((channelId: string, identity: string) => {
    requestId.current += 1;
    setPresence((current) => ({
      ...current,
      byChannel: withoutParticipant(current.byChannel, channelId, identity),
    }));
  }, []);

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
  return { byChannel, refresh, forget };
}
