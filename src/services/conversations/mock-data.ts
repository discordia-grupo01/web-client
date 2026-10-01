import {
  otherParticipantId,
  type Conversation,
  type DmMessage,
} from "@discordia/client-shared";

import { DEMO_AUTHORS } from "@/services/messages/mock-data";

/**
 * Datos de demo para maquetar Mensajes Directos mientras no exista el
 * servicio de conversaciones en el back. Se borra entero cuando se integre.
 */

/** Partners demo con los que ya hay una conversacion iniciada. */
const DEMO_PARTNER_IDS = Object.keys(DEMO_AUTHORS);

/** Yo bloqueé a este partner: no le puedo escribir. */
export const BLOCKED_BY_ME = new Set<string>(["demo-night"]);
/** Este partner me bloqueó a mí: mis envíos no se entregan. */
export const BLOCKS_ME = new Set<string>(["demo-pixel"]);

/** Conversaciones que arrancan marcadas como no leídas. */
export const INITIALLY_UNREAD_CONVERSATION_IDS = ["dm-demo-xeno"];

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

const SEED_BY_PARTNER: Record<
  string,
  Array<{ from: "partner" | "me"; content: string; minutesAgo: number }>
> = {
  "demo-xeno": [
    {
      from: "partner",
      content: "¿Ya viste el nuevo mapa del torneo? Está increíble 🔥",
      minutesAgo: 130,
    },
    {
      from: "me",
      content: "Sí! Cuando quieras practicamos en el canal de voz",
      minutesAgo: 125,
    },
  ],
  "demo-night": [
    {
      from: "me",
      content: "¿Podés moderar la sesión de hoy?",
      minutesAgo: 300,
    },
    {
      from: "partner",
      content: "Claro, cuento con eso 🎮",
      minutesAgo: 295,
    },
  ],
  "demo-pixel": [
    {
      from: "partner",
      content: "¿A qué hora es el torneo mañana? No encontré la info 👀",
      minutesAgo: 40,
    },
  ],
};

export function createDemoConversations(currentUserId: string): Conversation[] {
  return DEMO_PARTNER_IDS.map((partnerId) => ({
    id: `dm-${partnerId}`,
    participant_ids: [currentUserId, partnerId],
    created_at: minutesAgo(60 * 24),
  }));
}

export function createDemoDmMessages(
  conversation: Conversation,
  currentUserId: string,
): DmMessage[] {
  const partnerId = otherParticipantId(conversation, currentUserId);
  const seed = SEED_BY_PARTNER[partnerId] ?? [];
  return seed.map((entry, index) => ({
    id: `dm-seed-${conversation.id}-${index}`,
    conversation_id: conversation.id,
    author_id: entry.from === "me" ? currentUserId : partnerId,
    content: entry.content,
    created_at: minutesAgo(entry.minutesAgo),
    edited_at: null,
    deleted_at: null,
  }));
}
