"use client";

import {
  parseVoiceBridgeCommand,
  serializeVoiceBridgeMessage,
  type VoiceBridgeEvent,
  type VoiceConnectionStatus,
  type VoiceParticipant,
  voiceTileName,
  voiceTilesOf,
} from "@discordia/client-shared";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  createVoiceEmbedSession,
  type VoiceEmbedSession,
} from "@/components/voice/utils/voiceEmbedSession";
import { cn } from "@/lib/cn";

import { VoiceExpandedStage } from "./VoiceExpandedStage";
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
  const [canExpand, setCanExpand] = useState(false);
  const [expandedIdentity, setExpandedIdentity] = useState<string | null>(null);

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
        setExpandedIdentity(null);
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
        setCanExpand(command.canExpand === true);
        return;
      }
      if (command.type === "setExpanded") {
        setExpandedIdentity(command.identity);
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
  const requestExpand = useCallback((identity: string) => {
    postToApp({ type: "expandRequested", identity });
  }, []);

  const expanded = voiceTilesOf(participants).find(
    (participant) => participant.identity === expandedIdentity,
  );
  const expandedVideo = expanded ? videoOf(expanded.identity) : null;

  return (
    <main
      className={cn(
        "flex h-dvh flex-col",
        expandedVideo ? "bg-black" : "bg-surface",
      )}
    >
      {expanded && expandedVideo ? (
        <VoiceExpandedStage
          name={voiceTileName(expanded)}
          video={expandedVideo}
          isMirrored={expanded.isLocal && expandedVideo.source === "camera"}
        />
      ) : (
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
          canExpand={canExpand}
          onExpand={requestExpand}
        />
      )}
      <div ref={audioHostRef} hidden />
    </main>
  );
}
