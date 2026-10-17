"use client";

import { type VoicePresenceByChannel } from "@discordia/client-shared";

import { useCallback, useEffect, useRef, useState } from "react";

import { listVoiceParticipantsRequest } from "./client";
import { connectVoicePresence, type VoicePresenceEvent } from "./socket";

const EMPTY: VoicePresenceByChannel = {};

function applyPresenceEvent(
  current: VoicePresenceByChannel,
  event: VoicePresenceEvent,
  joined: boolean,
): VoicePresenceByChannel {
  const participants = [...(current[event.room_id] ?? [])];
  const index = participants.findIndex(
    (participant) => participant.participant_id === event.participant_id,
  );

  if (joined) {
    const participant = {
      participant_id: event.participant_id,
      name: event.name,
    };
    if (index >= 0) participants[index] = participant;
    else participants.push(participant);
    participants.sort((a, b) => a.name.localeCompare(b.name, "es"));
  } else if (index >= 0) {
    participants.splice(index, 1);
  } else {
    return current;
  }

  const result = { ...current };
  if (participants.length > 0) result[event.room_id] = participants;
  else delete result[event.room_id];
  return result;
}

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

  const applyEvent = useCallback(
    (event: VoicePresenceEvent, joined: boolean) => {
      setPresence((current) => {
        if (current.serverId !== event.server_id) return current;
        return {
          serverId: current.serverId,
          byChannel: applyPresenceEvent(current.byChannel, event, joined),
        };
      });
    },
    [],
  );

  useEffect(() => {
    if (!serverId) return;
    refresh();
    const disconnect = connectVoicePresence(serverId, {
      joined: (event) => applyEvent(event, true),
      left: (event) => applyEvent(event, false),
    });
    return () => {
      disconnect();
      requestId.current += 1;
    };
  }, [serverId, refresh, applyEvent]);

  const current = presence.serverId === serverId ? presence.byChannel : EMPTY;
  return { byChannel: current, refresh };
}
