"use client";

import {
  canDeleteMessage,
  canEditMessage,
  type FocusedMessage,
  LOAD_NEWER_MESSAGES_LABEL,
  LOAD_OLDER_MESSAGES_LABEL,
  LOADING_MESSAGES_LABEL,
  formatMemberSince,
  startsMessageGroup,
  startsNewDay,
  type Message,
  type MessageAuthor,
  unknownAuthor,
} from "@discordia/client-shared";

import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

import { useMessageHighlight } from "@/components/messages/hooks/useMessageHighlight";
import { useStickyScroll } from "@/components/messages/hooks/useStickyScroll";

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
  /** `ADD_REACTIONS` del usuario actual en el servidor. */
  canAddReactions?: boolean;
  /** Hay mensajes anteriores sin cargar (paginacion del historial). */
  hasMore?: boolean;
  isLoadingOlder?: boolean;
  onLoadOlder?: () => void;
  /** Hay mensajes mas nuevos sin cargar (se salto a un mensaje viejo). */
  hasNewer?: boolean;
  isLoadingNewer?: boolean;
  onLoadNewer?: () => void;
  /** Mensaje al que se salto: se centra y se resalta un momento. */
  focusedMessage?: FocusedMessage | null;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onEditMessage: (
    messageId: string,
    content: string,
  ) => void | Promise<MessageEditOutcome>;
  onDeleteMessage: (messageId: string) => void;
  /** Reintenta / elimina un mensaje propio que no se pudo enviar (por su `client_id`). */
  onRetryMessage?: (clientId: string) => void;
  onDiscardMessage?: (clientId: string) => void;
  onOpenProfile?: (userId: string) => void;
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
  canAddReactions = true,
  hasMore = false,
  isLoadingOlder = false,
  onLoadOlder,
  hasNewer = false,
  isLoadingNewer = false,
  onLoadNewer,
  focusedMessage = null,
  onToggleReaction,
  onEditMessage,
  onDeleteMessage,
  onRetryMessage,
  onDiscardMessage,
  onOpenProfile,
}: MessageListProps) {
  const scroll = useStickyScroll(messages, {
    isViewingPast: hasNewer,
    focusedMessage,
  });
  const highlightedId = useMessageHighlight(focusedMessage);

  return (
    <div
      {...scroll}
      // Con el globito de "Ir al presente" abajo, aire para que no tape el final.
      className={cn(
        "flex-1 overflow-y-auto px-2 py-4 md:px-4",
        hasNewer && "pb-14",
      )}
    >
      {hasMore && onLoadOlder ? (
        <LoadMoreButton
          label={LOAD_OLDER_MESSAGES_LABEL}
          isLoading={isLoadingOlder}
          onClick={onLoadOlder}
          className="mb-2"
        />
      ) : (
        welcome
      )}

      <ol aria-label={label}>
        {messages.map((message, index) => {
          const previous = messages[index - 1];
          const newDay = startsNewDay(
            previous?.inserted_at,
            message.inserted_at,
          );
          return (
            <li key={message.id} data-message-id={message.id}>
              {newDay ? (
                <div
                  role="separator"
                  className="text-content-muted mt-3 flex items-center gap-3 px-2 text-xs font-semibold"
                >
                  <span className="bg-line h-px flex-1" />
                  <span>{formatMemberSince(message.inserted_at)}</span>
                  <span className="bg-line h-px flex-1" />
                </div>
              ) : null}
              <MessageItem
                message={message}
                author={
                  authors[message.user_id] ?? unknownAuthor(message.user_id)
                }
                isGroupStart={newDay || startsMessageGroup(previous, message)}
                isFocused={message.id === highlightedId}
                canEdit={
                  currentUserId !== null &&
                  canEditMessage(message, currentUserId, canSendMessages)
                }
                canDelete={
                  currentUserId !== null &&
                  canDeleteMessage(message, currentUserId, canManageMessages)
                }
                onToggleReaction={(emoji) =>
                  onToggleReaction(message.id, emoji)
                }
                canAddReactions={canAddReactions}
                onOpenProfile={onOpenProfile}
                onEdit={(content) => onEditMessage(message.id, content)}
                onDelete={() => onDeleteMessage(message.id)}
                onRetry={
                  message.client_id && onRetryMessage
                    ? () => onRetryMessage(message.client_id!)
                    : undefined
                }
                onDiscard={
                  message.client_id && onDiscardMessage
                    ? () => onDiscardMessage(message.client_id!)
                    : undefined
                }
              />
            </li>
          );
        })}
      </ol>

      {hasNewer && onLoadNewer ? (
        <LoadMoreButton
          label={LOAD_NEWER_MESSAGES_LABEL}
          isLoading={isLoadingNewer}
          onClick={onLoadNewer}
          className="mt-2"
        />
      ) : null}
    </div>
  );
}

function LoadMoreButton({
  label,
  isLoading,
  onClick,
  className,
}: {
  label: string;
  isLoading: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex justify-center", className)}>
      <button
        type="button"
        onClick={onClick}
        disabled={isLoading}
        className="text-content-muted hover:text-content cursor-pointer rounded-md px-3 py-1 text-xs disabled:cursor-wait disabled:opacity-60"
      >
        {isLoading ? LOADING_MESSAGES_LABEL : label}
      </button>
    </div>
  );
}
