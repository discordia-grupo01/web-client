import type {
  Channel,
  VoiceParticipant,
  VoicePresenceByChannel,
} from "@discordia/client-shared";

/*
 * Datos de prueba mientras la voz no esta conectada con signaling ni LiveKit.
 * Reemplazan, respectivamente, a `GET /api/voice/participants` (quien esta en
 * cada canal) y a los participantes remotos de la sala de LiveKit.
 */

const DEMO_PARTICIPANTS: readonly VoiceParticipant[] = [
  {
    identity: "demo-xenoblaze",
    name: "XenoBlaze",
    isLocal: false,
    muted: false,
    speaking: true,
    cameraOn: false,
    screenSharing: false,
    mutedForMe: false,
  },
  {
    identity: "demo-nightowl",
    name: "NightOwl_42",
    isLocal: false,
    muted: true,
    speaking: false,
    cameraOn: true,
    screenSharing: false,
    mutedForMe: false,
  },
  {
    identity: "demo-pixelhunter",
    name: "PixelHunter",
    isLocal: false,
    muted: false,
    speaking: false,
    cameraOn: false,
    screenSharing: true,
    mutedForMe: false,
  },
];

/** El primer canal de voz del servidor arranca con gente; el resto, vacio. */
export function mockRemotesFor(
  channels: readonly Channel[],
  channelId: string,
): VoiceParticipant[] {
  const firstVoice = channels.find((channel) => channel.kind === "voice");
  return firstVoice?.id === channelId
    ? DEMO_PARTICIPANTS.map((p) => ({ ...p }))
    : [];
}

export function mockPresenceFor(
  channels: readonly Channel[],
): VoicePresenceByChannel {
  const firstVoice = channels.find((channel) => channel.kind === "voice");
  if (!firstVoice) return {};
  return {
    [firstVoice.id]: DEMO_PARTICIPANTS.map(({ identity, name }) => ({
      participant_id: identity,
      name,
    })),
  };
}

/** Quien "habla" en la proxima vuelta: uno al azar de los que no estan muteados. */
export function pickMockSpeakers(
  remotes: readonly VoiceParticipant[],
  random: () => number = Math.random,
): string[] {
  const candidates = remotes.filter((participant) => !participant.muted);
  if (candidates.length === 0) return [];
  const index = Math.floor(random() * (candidates.length + 1));
  const speaker = candidates[index];
  return speaker ? [speaker.identity] : [];
}
