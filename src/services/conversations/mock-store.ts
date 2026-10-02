import type { Conversation, DmMessage } from "@discordia/client-shared";

import { createDemoConversations, createDemoDmMessages } from "./mock-data";

/**
 * "Backend" en memoria mientras no exista el servicio de conversaciones:
 * arma la lista una vez por usuario logueado y guarda los mensajes por
 * conversacion durante la sesion (se pierden al recargar).
 *
 * TODO: reemplazar por `client.ts` (BFF `/api/conversations`) cuando el back
 * tenga DMs. La firma de estas funciones es la costura: el hook
 * `useDirectMessages` no deberia cambiar.
 */
let seededForUserId: string | null = null;
let conversations: Conversation[] = [];
const messagesByConversation = new Map<string, DmMessage[]>();

export function loadConversations(currentUserId: string): Conversation[] {
  if (seededForUserId !== currentUserId) {
    seededForUserId = currentUserId;
    conversations = createDemoConversations(currentUserId);
    messagesByConversation.clear();
    for (const conversation of conversations) {
      messagesByConversation.set(
        conversation.id,
        createDemoDmMessages(conversation, currentUserId),
      );
    }
  }
  return conversations;
}

export function loadConversationMessages(conversationId: string): DmMessage[] {
  return messagesByConversation.get(conversationId) ?? [];
}

export function saveConversationMessages(
  conversationId: string,
  messages: DmMessage[],
): void {
  messagesByConversation.set(conversationId, messages);
}

export function createLocalDmMessage(
  conversationId: string,
  authorId: string,
  content: string,
): DmMessage {
  return {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    conversation_id: conversationId,
    user_id: authorId,
    content: content.trim(),
    inserted_at: new Date().toISOString(),
    edited_at: null,
    deleted_at: null,
  };
}

/** Devuelve la conversacion existente con `partnerId`, o crea una vacia. */
export function findOrCreateConversationWith(
  currentUserId: string,
  partnerId: string,
): Conversation {
  const existing = conversations.find((conversation) =>
    conversation.participant_ids.includes(partnerId),
  );
  if (existing) return existing;

  const conversation: Conversation = {
    id: `dm-${partnerId}`,
    participant_ids: [currentUserId, partnerId],
    created_at: new Date().toISOString(),
  };
  conversations = [...conversations, conversation];
  messagesByConversation.set(conversation.id, []);
  return conversation;
}
