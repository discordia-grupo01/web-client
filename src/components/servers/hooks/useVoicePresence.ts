"use client";

import {
  type VoiceCallStarts,
  type VoicePresenceByChannel,
  type VoicePresenceEvent,
  withCallStart,
} from "@discordia/client-shared";

import { useCallback, useEffect, useRef, useState } from "react";

import { listVoiceParticipantsRequest } from "@/services/voice/client";
import { connectVoicePresence } from "@/services/voice/socket";

const EMPTY: VoicePresenceByChannel = {};
const NO_CALLS: VoiceCallStarts = {};

interface ServerPresence {
  byChannel: VoicePresenceByChannel;
  /** Desde cuando hay llamada en cada canal (ms), segun el back. */
  startsByChannel: VoiceCallStarts;
}

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

function applyEvent(
  current: ServerPresence,
  event: VoicePresenceEvent,
  joined: boolean,
): ServerPresence {
  return {
    byChannel: applyPresenceEvent(current.byChannel, event, joined),
    startsByChannel: withCallStart(current.startsByChannel, event),
  };
}

export function useVoicePresence(serverId: string | null): ServerPresence & {
  refresh: () => void;
} {
  const [presence, setPresence] = useState<
    ServerPresence & { serverId: string | null }
  >({ serverId, byChannel: EMPTY, startsByChannel: NO_CALLS });
  const requestId = useRef(0);
  const eventSequence = useRef(0);
  const eventJournal = useRef<PresenceJournalEntry[]>([]);

  const refresh = useCallback(() => {
    if (!serverId) return;
    const id = ++requestId.current;
    const snapshotSequence = eventSequence.current;
    void listVoiceParticipantsRequest(serverId).then((result) => {
      if (id !== requestId.current || !result.ok) return;
      const snapshot: ServerPresence = {
        byChannel: result.byChannel,
        startsByChannel: result.startsByChannel,
      };
      setPresence((current) => {
        if (current.serverId !== serverId) {
          return { serverId, ...snapshot };
        }

        const next = eventJournal.current
          .filter(({ sequence }) => sequence > snapshotSequence)
          .reduce(
            (state, { event, joined }) => applyEvent(state, event, joined),
            snapshot,
          );

        eventJournal.current = eventJournal.current.filter(
          ({ sequence }) => sequence > snapshotSequence,
        );
        return { serverId, ...next };
      });
    });
  }, [serverId]);

  const receiveEvent = useCallback(
    (event: VoicePresenceEvent, joined: boolean) => {
      if (event.server_id !== serverId) return;
      const sequence = ++eventSequence.current;
      eventJournal.current.push({ event, joined, sequence });
      setPresence((current) => {
        if (current.serverId !== serverId) return current;
        return {
          serverId: current.serverId,
          ...applyEvent(current, event, joined),
        };
      });
    },
    [serverId],
  );

  useEffect(() => {
    if (!serverId) return;

    refresh();
    const disconnect = connectVoicePresence(serverId, {
      joined: (event) => receiveEvent(event, true),
      left: (event) => receiveEvent(event, false),
      rejoined: refresh,
    });

    return () => {
      disconnect();
      requestId.current += 1;
    };
  }, [serverId, refresh, receiveEvent]);

  if (presence.serverId !== serverId) {
    return { byChannel: EMPTY, startsByChannel: NO_CALLS, refresh };
  }
  return {
    byChannel: presence.byChannel,
    startsByChannel: presence.startsByChannel,
    refresh,
  };
}
