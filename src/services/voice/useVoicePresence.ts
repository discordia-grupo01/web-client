"use client";

import {
  VOICE_PARTICIPANTS_POLL_MS,
  type VoicePresenceByChannel,
  type VoicePresenceParticipant,
} from "@discordia/client-shared";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { listVoiceParticipantsRequest } from "./client";

const EMPTY: VoicePresenceByChannel = {};

interface HiddenParticipant {
  channelId: string;
  identity: string;
}

function withoutParticipant(
  byChannel: VoicePresenceByChannel,
  { channelId, identity }: HiddenParticipant,
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
 * llamada uno ya sabe que no esta) y lo mantiene afuera aunque los pedidos
 * siguientes todavia lo traigan: el DELETE a signaling puede tardar mas que
 * un poll. `confirm` se llama cuando el back ya refleja la salida (o el cambio
 * de canal); la primera respuesta pedida despues vuelve a ser la verdad.
 */
export function useVoicePresence(serverId: string | null): {
  byChannel: VoicePresenceByChannel;
  refresh: () => void;
  forget: (channelId: string, identity: string) => void;
  confirm: () => void;
} {
  const [presence, setPresence] = useState<{
    serverId: string | null;
    byChannel: VoicePresenceByChannel;
  }>({ serverId, byChannel: EMPTY });
  const [hidden, setHidden] = useState<readonly HiddenParticipant[]>([]);
  const requestId = useRef(0);
  const confirmedFrom = useRef<number | null>(null);

  const refresh = useCallback(() => {
    if (!serverId) return;
    const id = ++requestId.current;
    void listVoiceParticipantsRequest(serverId).then((result) => {
      if (id !== requestId.current || !result.ok) return;
      setPresence({ serverId, byChannel: result.byChannel });
      if (confirmedFrom.current !== null && id >= confirmedFrom.current) {
        confirmedFrom.current = null;
        setHidden([]);
      }
    });
  }, [serverId]);

  const forget = useCallback((channelId: string, identity: string) => {
    confirmedFrom.current = null;
    setHidden((current) =>
      current.some(
        (entry) => entry.channelId === channelId && entry.identity === identity,
      )
        ? current
        : [...current, { channelId, identity }],
    );
  }, []);

  const confirm = useCallback(() => {
    confirmedFrom.current = requestId.current + 1;
    refresh();
  }, [refresh]);

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

  const current = presence.serverId === serverId ? presence.byChannel : EMPTY;
  const byChannel = useMemo(
    () => hidden.reduce(withoutParticipant, current),
    [hidden, current],
  );
  return { byChannel, refresh, forget, confirm };
}
