"use client";

import {
  parseVoiceBridgeCommand,
  serializeVoiceBridgeMessage,
  type VoiceBridgeEvent,
} from "@discordia/client-shared";

import { useEffect, useRef } from "react";

import { createVoiceEmbedSession } from "@/services/voice/voiceEmbedSession";

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage: (message: string) => void };
  }
}

function postToApp(event: VoiceBridgeEvent) {
  window.ReactNativeWebView?.postMessage(serializeVoiceBridgeMessage(event));
}

/** Puente entre la app y LiveKit; solo reproduce el audio, no se ve nada. */
export function VoiceEmbed() {
  const audioHostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const audioHost = audioHostRef.current;
    if (!audioHost) return;

    const session = createVoiceEmbedSession(postToApp, audioHost);
    // La app inyecta `window.dispatchEvent(new MessageEvent("message", ...))`.
    const onMessage = (event: MessageEvent) => {
      const command = parseVoiceBridgeCommand(event.data);
      if (command) session.handle(command);
    };

    window.addEventListener("message", onMessage);
    postToApp({ type: "ready" });

    return () => {
      window.removeEventListener("message", onMessage);
      session.dispose();
    };
  }, []);

  return <div ref={audioHostRef} hidden />;
}
