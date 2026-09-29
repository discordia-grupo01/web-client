import type { Message } from "@discordia/client-shared";

import { createDemoMessages } from "./mock-data";

/**
 * "Backend" en memoria mientras no exista el servicio de mensajes: guarda los
 * mensajes por canal durante la sesion (se pierden al recargar).
 *
 * TODO: reemplazar por `client.ts` (BFF `/api/channels/:id/messages`) cuando
 * el back tenga mensajes. La firma de estas funciones es la costura: el hook
 * `useChannelMessages` no deberia cambiar.
 */
const messagesByChannel = new Map<string, Message[]>();

export function loadChannelMessages(
  channelId: string,
  channelName: string,
): Message[] {
  const stored = messagesByChannel.get(channelId);
  if (stored) return stored;

  const seeded = createDemoMessages(channelId, channelName);
  messagesByChannel.set(channelId, seeded);
  return seeded;
}

export function saveChannelMessages(
  channelId: string,
  messages: Message[],
): void {
  messagesByChannel.set(channelId, messages);
}

export function createLocalMessage(
  channelId: string,
  authorId: string,
  content: string,
): Message {
  return {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    channel_id: channelId,
    author_id: authorId,
    content: content.trim(),
    created_at: new Date().toISOString(),
    reactions: [],
  };
}
