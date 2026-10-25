"use client";

import { type VoicePresenceByChannel } from "@discordia/client-shared";

import { useCallback, useEffect, useRef, useState } from "react";

import { listVoiceParticipantsRequest } from "@/services/voice/client";
import {
  connectVoicePresence,
  type VoicePresenceEvent,
} from "@/services/voice/socket";

const EMPTY: VoicePresenceByChannel = {};

interface PresenceJournalEntry {
  event: VoicePresenceEvent;
  joined: boolean;
  sequence: number;
}

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
  const eventSequence = useRef(0);
  const eventJournal = useRef<PresenceJournalEntry[]>([]);

  const refresh = useCallback(() => {
    if (!serverId) return;
    const id = ++requestId.current;
    const snapshotSequence = eventSequence.current;
    void listVoiceParticipantsRequest(serverId).then((result) => {
      if (id !== requestId.current || !result.ok) return;
      setPresence((current) => {
        if (current.serverId !== serverId) {
          return { serverId, byChannel: result.byChannel };
        }

        const byChannel = eventJournal.current
          .filter(({ sequence }) => sequence > snapshotSequence)
          .reduce(
            (next, { event, joined }) =>
              applyPresenceEvent(next, event, joined),
            result.byChannel,
          );

        eventJournal.current = eventJournal.current.filter(
          ({ sequence }) => sequence > snapshotSequence,
        );
        return { serverId, byChannel };
      });
    });
  }, [serverId]);

  const applyEvent = useCallback(
    (event: VoicePresenceEvent, joined: boolean) => {
      if (event.server_id !== serverId) return;
      const sequence = ++eventSequence.current;
      eventJournal.current.push({ event, joined, sequence });
      setPresence((current) => {
        if (current.serverId !== serverId) return current;
        return {
          serverId: current.serverId,
          byChannel: applyPresenceEvent(current.byChannel, event, joined),
        };
      });
    },
    [serverId],
  );

  useEffect(() => {
    if (!serverId) return;

    refresh();
    const disconnect = connectVoicePresence(serverId, {
      joined: (event) => applyEvent(event, true),
      left: (event) => applyEvent(event, false),
      rejoined: refresh,
    });

    return () => {
      disconnect();
      requestId.current += 1;
    };
  }, [serverId, refresh, applyEvent]);

  const current = presence.serverId === serverId ? presence.byChannel : EMPTY;
  return { byChannel: current, refresh };
}
