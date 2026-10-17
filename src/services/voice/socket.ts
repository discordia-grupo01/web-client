import { Socket } from "phoenix";

import { env } from "@/lib/env";

export interface VoicePresenceEvent {
  event_type: "voice.participant_joined" | "voice.participant_left";
  server_id: string;
  room_id: string;
  participant_id: string;
  name: string;
}

interface VoicePresenceHandlers {
  joined: (event: VoicePresenceEvent) => void;
  left: (event: VoicePresenceEvent) => void;
}

export function connectVoicePresence(
  serverId: string,
  handlers: VoicePresenceHandlers,
): () => void {
  const socket = new Socket(env.voiceWsUrl);
  const channel = socket.channel(`voice_server:${serverId}`, {});

  channel.on("voice.participant_joined", handlers.joined);
  channel.on("voice.participant_left", handlers.left);
  socket.connect();
  channel.join();

  return () => {
    channel.leave();
    socket.disconnect();
  };
}
