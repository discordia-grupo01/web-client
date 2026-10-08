"use client";

import {
  canDeleteMessage,
  canEditMessage,
  LOAD_OLDER_MESSAGES_LABEL,
  LOADING_MESSAGES_LABEL,
  startsMessageGroup,
  type Message,
  type MessageAuthor,
  type MentionResolver,
} from "@discordia/client-shared";

import { useLayoutEffect, useRef } from "react";

import { ChannelWelcome } from "./ChannelWelcome";
import { MessageItem, type MessageEditOutcome } from "./MessageItem";

interface MessageListProps {
  channelName: string;
  messages: Message[];
  authors: Record<string, MessageAuthor>;
  currentUserId: string | null;
  canManageMessages: boolean;
  canSendMessages: boolean;
  resolveMention?: MentionResolver;
  /** Hay mensajes anteriores sin cargar (paginacion del historial). */
  hasMore?: boolean;
  isLoadingOlder?: boolean;
  onLoadOlder?: () => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onEditMessage: (
    messageId: string,
    content: string,
  ) => void | Promise<MessageEditOutcome>;
  onDeleteMessage: (messageId: string) => void;
}

function unknownAuthor(id: string): MessageAuthor {
  return {
    id,
    name: "Usuario desconocido",
    avatarUrl: null,
    roleName: null,
    roleColor: null,
  };
}

/** Historial del canal. Baja solo al fondo cuando llega un mensaje nuevo. */
export function MessageList({
  channelName,
  messages,
  authors,
  currentUserId,
  canManageMessages,
  canSendMessages,
  resolveMention,
  hasMore = false,
  isLoadingOlder = false,
  onLoadOlder,
  onToggleReaction,
  onEditMessage,
  onDeleteMessage,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isNearBottom = useRef(true);
  const previous = useRef<{
    firstId: string | undefined;
    lastId: string | undefined;
    scrollHeight: number;
  }>({ firstId: undefined, lastId: undefined, scrollHeight: 0 });

  // Que pasa con el scroll segun lo que cambio en la lista:
  // - llegaron mensajes viejos arriba (cargar anteriores): se mantiene lo que
  //   se estaba leyendo, sin saltar;
  // - primera carga o mensaje nuevo al final: baja, salvo que se este leyendo
  //   mas arriba (no se le quita el lugar a quien mira el historial).
  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const firstId = messages[0]?.id;
    const lastId = messages[messages.length - 1]?.id;
    const before = previous.current;

    if (
      before.firstId !== undefined &&
      firstId !== before.firstId &&
      lastId === before.lastId
    ) {
      container.scrollTop += container.scrollHeight - before.scrollHeight;
    } else if (lastId !== before.lastId) {
      if (before.lastId === undefined || isNearBottom.current) {
        container.scrollTop = container.scrollHeight;
      }
    }
    previous.current = {
      firstId,
      lastId,
      scrollHeight: container.scrollHeight,
    };
  }, [messages]);

  return (
    <div
      ref={scrollRef}
      onScroll={(event) => {
        const { scrollHeight, scrollTop, clientHeight } = event.currentTarget;
        isNearBottom.current = scrollHeight - scrollTop - clientHeight < 80;
      }}
      className="flex-1 overflow-y-auto px-2 py-4 md:px-4"
    >
      {hasMore && onLoadOlder ? (
        <div className="mb-2 flex justify-center">
          <button
            type="button"
            onClick={onLoadOlder}
            disabled={isLoadingOlder}
            className="text-content-muted hover:text-content cursor-pointer rounded-md px-3 py-1 text-xs disabled:cursor-wait disabled:opacity-60"
          >
            {isLoadingOlder
              ? LOADING_MESSAGES_LABEL
              : LOAD_OLDER_MESSAGES_LABEL}
          </button>
        </div>
      ) : (
        <ChannelWelcome channelName={channelName} />
      )}

      <ol aria-label={`Mensajes de #${channelName}`}>
        {messages.map((message, index) => (
          <li key={message.id}>
            <MessageItem
              message={message}
              author={
                authors[message.user_id] ?? unknownAuthor(message.user_id)
              }
              isGroupStart={startsMessageGroup(messages[index - 1], message)}
              canEdit={
                currentUserId !== null &&
                canEditMessage(message, currentUserId, canSendMessages)
              }
              canDelete={
                currentUserId !== null &&
                canDeleteMessage(message, currentUserId, canManageMessages)
              }
              resolveMention={resolveMention}
              onToggleReaction={(emoji) => onToggleReaction(message.id, emoji)}
              onEdit={(content) => onEditMessage(message.id, content)}
              onDelete={() => onDeleteMessage(message.id)}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}
