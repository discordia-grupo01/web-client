"use client";

import {
  editMessageContent,
  otherParticipantId,
  removeMessages,
  toggleReaction as toggleReactionIn,
  validateMessageContent,
  type Conversation,
  type DmMessage as BaseDmMessage,
  type MessageAuthor,
  type MessageReaction,
} from "@discordia/client-shared";

import { useCallback, useEffect, useMemo, useState } from "react";

import { DEMO_AUTHORS } from "@/services/messages/mock-data";

import { useBlockedUsersContext } from "@/services/blocks/BlockedUsersContext";

import { BLOCKS_ME, INITIALLY_UNREAD_CONVERSATION_IDS } from "./mock-data";
import {
  createLocalDmMessage,
  findOrCreateConversationWith,
  loadConversationMessages,
  loadConversations,
  saveConversationMessages,
} from "./mock-store";

/** Mensaje directo + reacciones (maquetadas, solo en memoria hasta que el back las soporte). */
export type DmMessage = BaseDmMessage & { reactions?: MessageReaction[] };

export interface ConversationSummary {
  conversation: Conversation;
  partner: MessageAuthor;
  lastMessage: DmMessage | null;
  isUnread: boolean;
  /** Yo bloqueé al partner: no le puedo escribir. */
  blockedByMe: boolean;
  /** El partner me bloqueó a mí: mis envíos no se entregan. */
  blocksMe: boolean;
}

export type SendDmResult = "sent" | "blocked" | "invalid";

function unknownAuthor(id: string): MessageAuthor {
  return {
    id,
    name: "Usuario desconocido",
    avatarUrl: null,
    roleName: null,
    roleColor: null,
  };
}

/** Mensajes directos de la sesion actual: lista de conversaciones + la activa. */
export function useDirectMessages(currentAuthor: MessageAuthor | null) {
  const currentUserId = currentAuthor?.id ?? null;
  const { blockedIds } = useBlockedUsersContext();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messagesByConversation, setMessagesByConversation] = useState<
    Record<string, DmMessage[]>
  >({});
  // Autores que no son de demo (ej. alguien al que se le escribe desde su perfil).
  const [extraAuthors, setExtraAuthors] = useState<
    Record<string, MessageAuthor>
  >({});
  const [unreadIds, setUnreadIds] = useState<Set<string>>(new Set());
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!currentUserId) return;
    const loaded = loadConversations(currentUserId);
    setConversations(loaded);
    setUnreadIds(new Set(INITIALLY_UNREAD_CONVERSATION_IDS));
    setMessagesByConversation(
      Object.fromEntries(
        loaded.map((conversation) => [
          conversation.id,
          loadConversationMessages(conversation.id),
        ]),
      ),
    );
  }, [currentUserId]);

  const summaries: ConversationSummary[] = useMemo(() => {
    if (!currentUserId) return [];
    return conversations.map((conversation) => {
      const partnerId = otherParticipantId(conversation, currentUserId);
      const messages = messagesByConversation[conversation.id] ?? [];
      return {
        conversation,
        partner:
          DEMO_AUTHORS[partnerId] ??
          extraAuthors[partnerId] ??
          unknownAuthor(partnerId),
        lastMessage: messages[messages.length - 1] ?? null,
        isUnread: unreadIds.has(conversation.id),
        blockedByMe: blockedIds.has(partnerId),
        blocksMe: BLOCKS_ME.has(partnerId),
      };
    });
  }, [
    conversations,
    messagesByConversation,
    currentUserId,
    unreadIds,
    extraAuthors,
    blockedIds,
  ]);

  const activeMessages = activeConversationId
    ? (messagesByConversation[activeConversationId] ?? [])
    : [];
  const activeSummary =
    summaries.find((s) => s.conversation.id === activeConversationId) ?? null;

  function openConversation(conversationId: string) {
    setActiveConversationId(conversationId);
    setUnreadIds((prev) => {
      if (!prev.has(conversationId)) return prev;
      const next = new Set(prev);
      next.delete(conversationId);
      return next;
    });
  }

  const startConversationWith = useCallback(
    (partnerId: string, partner?: MessageAuthor) => {
      if (!currentUserId) return;
      if (partner) {
        setExtraAuthors((prev) => ({ ...prev, [partnerId]: partner }));
      }
      const conversation = findOrCreateConversationWith(
        currentUserId,
        partnerId,
      );
      setConversations((prev) =>
        prev.some((c) => c.id === conversation.id)
          ? prev
          : [...prev, conversation],
      );
      setMessagesByConversation((prev) => ({
        ...prev,
        [conversation.id]:
          prev[conversation.id] ?? loadConversationMessages(conversation.id),
      }));
      openConversation(conversation.id);
    },
    [currentUserId],
  );

  function updateConversationMessages(
    conversationId: string,
    updater: (messages: DmMessage[]) => DmMessage[],
  ) {
    setMessagesByConversation((prev) => {
      const updated = updater(prev[conversationId] ?? []);
      saveConversationMessages(conversationId, updated);
      return { ...prev, [conversationId]: updated };
    });
  }

  const sendMessage = useCallback(
    (content: string): SendDmResult => {
      if (!currentAuthor || !activeConversationId || !activeSummary) {
        return "invalid";
      }
      if (validateMessageContent(content)) return "invalid";
      if (activeSummary.blockedByMe || activeSummary.blocksMe) {
        return "blocked";
      }

      const message = createLocalDmMessage(
        activeConversationId,
        currentAuthor.id,
        content,
      );
      updateConversationMessages(activeConversationId, (messages) => [
        ...messages,
        message,
      ]);
      return "sent";
    },
    [currentAuthor, activeConversationId, activeSummary],
  );

  const toggleReaction = useCallback(
    (messageId: string, emoji: string) => {
      if (!activeConversationId) return;
      updateConversationMessages(activeConversationId, (messages) =>
        messages.map((message) =>
          message.id === messageId
            ? {
                ...message,
                reactions: toggleReactionIn(message.reactions, emoji),
              }
            : message,
        ),
      );
    },
    [activeConversationId],
  );

  const editMessage = useCallback(
    (messageId: string, content: string) => {
      if (!activeConversationId || validateMessageContent(content)) return;
      updateConversationMessages(activeConversationId, (messages) =>
        messages.map((message) =>
          message.id === messageId
            ? editMessageContent(message, content.trim())
            : message,
        ),
      );
    },
    [activeConversationId],
  );

  const deleteMessage = useCallback(
    (messageId: string) => {
      if (!activeConversationId) return;
      updateConversationMessages(activeConversationId, (messages) =>
        removeMessages(messages, [messageId]),
      );
    },
    [activeConversationId],
  );

  const knownPartners = useMemo(
    () =>
      Object.values(DEMO_AUTHORS).filter(
        (author) => author.id !== currentUserId,
      ),
    [currentUserId],
  );

  return {
    conversations: summaries,
    activeConversationId,
    activeMessages,
    activeSummary,
    knownPartners,
    openConversation,
    startConversationWith,
    sendMessage,
    toggleReaction,
    editMessage,
    deleteMessage,
  };
}
