"use client";

import {
  canDeleteMessage,
  canEditMessage,
  LOAD_OLDER_MESSAGES_LABEL,
  LOADING_MESSAGES_LABEL,
  startsMessageGroup,
  type Message,
  type MessageAuthor,
  unknownAuthor,
} from "@discordia/client-shared";

import type { ReactNode } from "react";

import { useStickyScroll } from "@/hooks/useStickyScroll";

import { MessageItem, type MessageEditOutcome } from "./MessageItem";

interface MessageListProps {
  /** Encabezado del comienzo del historial (se muestra cuando no hay mas mensajes anteriores). */
  welcome: ReactNode;
  /** Nombre accesible de la lista. */
  label: string;
  messages: Message[];
  authors: Record<string, MessageAuthor>;
  currentUserId: string | null;
  canManageMessages: boolean;
  canSendMessages: boolean;
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

/** Historial del canal. Baja solo al fondo cuando llega un mensaje nuevo. */
export function MessageList({
  welcome,
  label,
  messages,
  authors,
  currentUserId,
  canManageMessages,
  canSendMessages,
  hasMore = false,
  isLoadingOlder = false,
  onLoadOlder,
  onToggleReaction,
  onEditMessage,
  onDeleteMessage,
}: MessageListProps) {
  const scroll = useStickyScroll(messages);

  return (
    <div {...scroll} className="flex-1 overflow-y-auto px-2 py-4 md:px-4">
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
        welcome
      )}

      <ol aria-label={label}>
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
