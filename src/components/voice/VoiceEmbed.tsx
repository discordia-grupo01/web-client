"use client";

import {
  parseVoiceBridgeCommand,
  serializeVoiceBridgeMessage,
  type VoiceBridgeEvent,
  type VoiceConnectionStatus,
  type VoiceParticipant,
} from "@discordia/client-shared";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  createVoiceEmbedSession,
  type VoiceEmbedSession,
} from "@/components/voice/utils/voiceEmbedSession";

import { VoiceParticipantGrid } from "./VoiceParticipantGrid";

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage: (message: string) => void };
  }
}

function postToApp(event: VoiceBridgeEvent) {
  window.ReactNativeWebView?.postMessage(serializeVoiceBridgeMessage(event));
}

export function VoiceEmbed() {
  const audioHostRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<VoiceEmbedSession | null>(null);
  const [participants, setParticipants] = useState<VoiceParticipant[]>([]);
  const [status, setStatus] = useState<VoiceConnectionStatus>("idle");
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);
  const [pinnedIdentity, setPinnedIdentity] = useState<string | null>(null);

  useEffect(() => {
    const audioHost = audioHostRef.current;
    if (!audioHost) return;

    const post = (event: VoiceBridgeEvent) => {
      postToApp(event);
      if (event.type === "participants") setParticipants(event.participants);
      else if (event.type === "status") setStatus(event.status);
      else if (event.type === "disconnected") {
        setParticipants([]);
        setStatus("idle");
      }
    };

    const session = createVoiceEmbedSession(post, audioHost);
    sessionRef.current = session;
    const onMessage = (event: MessageEvent) => {
      const command = parseVoiceBridgeCommand(event.data);
      if (!command) return;
      if (command.type === "setAppearance") {
        document.documentElement.dataset.theme = command.theme;
        setLocalAvatarUrl(command.localAvatarUrl);
        return;
      }
      if (command.type === "setPinned") {
        setPinnedIdentity(command.identity);
        return;
      }
      session.handle(command);
    };

    window.addEventListener("message", onMessage);
    postToApp({ type: "ready" });

    return () => {
      window.removeEventListener("message", onMessage);
      sessionRef.current = null;
      session.dispose();
    };
  }, []);

  const videoOf = useCallback(
    (identity: string) => sessionRef.current?.videoOf(identity) ?? null,
    [],
  );
  const requestMuteForMe = useCallback((identity: string) => {
    postToApp({ type: "muteForMeRequested", identity });
  }, []);
  const requestParticipants = useCallback(() => {
    postToApp({ type: "participantsRequested" });
  }, []);
  const requestPin = useCallback((identity: string | null) => {
    postToApp({ type: "pinRequested", identity });
  }, []);

  return (
    <main className="bg-surface flex h-dvh flex-col">
      <VoiceParticipantGrid
        participants={participants}
        isConnecting={status === "connecting"}
        ownAvatarSrc={localAvatarUrl}
        videoOf={videoOf}
        onToggleMutedForMe={requestMuteForMe}
        onShowParticipants={requestParticipants}
        pinnedIdentity={pinnedIdentity}
        onPinChange={requestPin}
        onTilePress={requestParticipants}
      />
      <div ref={audioHostRef} hidden />
    </main>
  );
}
