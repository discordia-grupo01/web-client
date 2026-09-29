import type { Message, MessageAuthor } from "@discordia/client-shared";

/**
 * Datos de demo para maquetar el chat mientras no exista el servicio de
 * mensajes. Se borra entero cuando se integre el back.
 */

export const DEMO_AUTHORS: Record<string, MessageAuthor> = {
  "demo-xeno": {
    id: "demo-xeno",
    name: "XenoBlaze",
    avatarUrl: null,
    roleName: "Administrador",
    roleColor: "#fce3a4",
  },
  "demo-night": {
    id: "demo-night",
    name: "NightOwl_42",
    avatarUrl: null,
    roleName: "Moderador",
    roleColor: "#38a169",
  },
  "demo-pixel": {
    id: "demo-pixel",
    name: "PixelHunter",
    avatarUrl: null,
    roleName: null,
    roleColor: "#6b95bd",
  },
};

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

/** Conversacion inicial de un canal de texto, con fechas relativas a ahora. */
export function createDemoMessages(
  channelId: string,
  channelName: string,
): Message[] {
  const seed: Omit<Message, "id" | "channel_id">[] = [
    {
      author_id: "demo-xeno",
      content: `¡Bienvenidos a #${channelName}! Recuerden leer las reglas antes de participar 🎮`,
      created_at: minutesAgo(50),
      reactions: [
        { emoji: "👋", count: 8, reacted_by_me: false },
        { emoji: "🎉", count: 5, reacted_by_me: false },
      ],
    },
    {
      author_id: "demo-pixel",
      content:
        "¿Alguien quiere hacer una partida esta noche? Buscamos 2 más para completar el equipo",
      created_at: minutesAgo(30),
      reactions: [{ emoji: "🎮", count: 3, reacted_by_me: false }],
    },
    {
      author_id: "demo-night",
      content:
        "¡Yo me apunto! @PixelHunter avisame a qué hora quedan y los encuentro en el canal de voz",
      created_at: minutesAgo(28),
      reactions: [],
    },
    {
      author_id: "demo-night",
      content: "Llevo semanas entrenando para esto 💪",
      created_at: minutesAgo(27),
      reactions: [],
    },
  ];

  return seed.map((message, index) => ({
    ...message,
    id: `demo-${channelId}-${index}`,
    channel_id: channelId,
  }));
}
