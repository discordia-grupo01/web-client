"use client";

import {
  CHAT_RECONNECTING_NOTICE,
  LOADING_MESSAGES_LABEL,
  type Message,
  type MessageAuthor,
} from "@discordia/client-shared";

import { useEffect, useMemo, useState } from "react";

import { ChatStatusNotice } from "@/components/messages/ChatStatusNotice";
import { ConnectionLostNotice } from "@/components/messages/ConnectionLostNotice";
import { MessageList } from "@/components/messages/MessageList";
import { useChannelMessages } from "@/services/messages/useChannelMessages";

import { DmWelcome } from "./DmWelcome";

interface DmHistoryProps {
  conversationId: string;
  partner: MessageAuthor;
  currentAuthor: MessageAuthor;
  /** Agrega al final los mensajes propios que todavia no llegaron o no se pudieron enviar. */
  withPending: (messages: Message[]) => Message[];
  /** Los mensajes del chat cambiaron: los pendientes que ya llegaron se sacan. */
  onMessagesChange: (messages: Message[]) => void;
  onRetryMessage: (clientId: string) => void;
  onDiscardMessage: (clientId: string) => void;
}

/**
 * Historial en vivo de una conversacion que ya existe. Una conversacion es un
 * canal para el back, asi que historial, editar, borrar y tiempo real son los
 * de `useChannelMessages`. Lo unico que no se usa es su `sendMessage`: en un DM
 * se envia con `send_dm` (ver `useDirectMessages`).
 */
export function DmHistory({
  conversationId,
  partner,
  currentAuthor,
  withPending,
  onMessagesChange,
  onRetryMessage,
  onDiscardMessage,
}: DmHistoryProps) {
  const {
    status,
    statusMessage,
    messages,
    hasMore,
    isLoadingOlder,
    loadOlder,
    retry,
    toggleReaction,
    editMessage,
    deleteMessage,
  } = useChannelMessages({ id: conversationId });
  useEffect(() => {
    if (messages) onMessagesChange(messages);
  }, [messages, onMessagesChange]);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const authors = useMemo(
    () => ({ [partner.id]: partner, [currentAuthor.id]: currentAuthor }),
    [partner, currentAuthor],
  );

  async function handleDelete(messageId: string) {
    setDeleteError(null);
    const result = await deleteMessage(messageId);
    if (!result.ok) setDeleteError(result.message);
  }

  if (statusMessage && status !== "ready") {
    return (
      <ChatStatusNotice
        message={statusMessage}
        onRetry={status === "error" ? retry : undefined}
      />
    );
  }

  return (
    <>
      {messages === null ? (
        status === "offline" ? (
          <ConnectionLostNotice variant="panel" />
        ) : (
          <ChatStatusNotice message={LOADING_MESSAGES_LABEL} />
        )
      ) : (
        <MessageList
          welcome={<DmWelcome partner={partner} />}
          label={`Conversación con ${partner.name}`}
          messages={withPending(messages)}
          authors={authors}
          currentUserId={currentAuthor.id}
          canManageMessages={false}
          canSendMessages
          hasMore={hasMore}
          isLoadingOlder={isLoadingOlder}
          onLoadOlder={loadOlder}
          onToggleReaction={toggleReaction}
          onEditMessage={editMessage}
          onDeleteMessage={handleDelete}
          onRetryMessage={onRetryMessage}
          onDiscardMessage={onDiscardMessage}
        />
      )}
      {deleteError ? (
        <p
          role="alert"
          className="bg-danger/10 text-danger shrink-0 px-4 py-1 text-center text-xs"
        >
          {deleteError}
        </p>
      ) : null}
      {status === "offline" && messages !== null ? (
        <ConnectionLostNotice variant="bar" />
      ) : null}
      {status === "reconnecting" ? (
        <p
          role="status"
          className="bg-surface-hover text-content-muted shrink-0 px-4 py-1 text-center text-xs"
        >
          {CHAT_RECONNECTING_NOTICE}
        </p>
      ) : null}
    </>
  );
}
