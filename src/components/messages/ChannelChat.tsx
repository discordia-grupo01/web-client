"use client";

import {
  CHAT_RECONNECTING_NOTICE,
  type Channel,
  LOADING_MESSAGES_LABEL,
  type MessageAuthor,
  type Role,
} from "@discordia/client-shared";

import { useMemo, useState } from "react";

import { buildMentionResolver } from "@/services/messages/message-mentions";
import { useChannelMessages } from "@/services/messages/useChannelMessages";
import { useMessageAuthors } from "@/services/messages/useMessageAuthors";

import { ChatStatusNotice } from "./ChatStatusNotice";
import { MessageComposer } from "./MessageComposer";
import { MessageList } from "./MessageList";

interface ChannelChatProps {
  serverId: string;
  channel: Channel;
  currentAuthor: MessageAuthor | null;
  serverRoles: Role[];
  canManageMessages: boolean;
  canMentionEveryone: boolean;
}

export function ChannelChat({
  serverId,
  channel,
  currentAuthor,
  serverRoles,
  canManageMessages,
  canMentionEveryone,
}: ChannelChatProps) {
  const {
    status,
    statusMessage,
    messages,
    hasMore,
    isLoadingOlder,
    loadOlder,
    retry,
    sendMessage,
    toggleReaction,
    editMessage,
    deleteMessage,
  } = useChannelMessages(channel);
  const authors = useMessageAuthors(serverId, messages, currentAuthor);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDelete(messageId: string) {
    setDeleteError(null);
    const result = await deleteMessage(messageId);
    if (!result.ok) setDeleteError(result.message);
  }

  const resolveMention = useMemo(
    () => buildMentionResolver(authors, serverRoles),
    [authors, serverRoles],
  );

  // Estados de los que no se sale solos: el canal no se puede mostrar.
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
        <ChatStatusNotice message={LOADING_MESSAGES_LABEL} />
      ) : (
        <MessageList
          channelName={channel.name}
          messages={messages}
          authors={authors}
          currentUserId={currentAuthor?.id ?? null}
          canManageMessages={canManageMessages}
          resolveMention={resolveMention}
          hasMore={hasMore}
          isLoadingOlder={isLoadingOlder}
          onLoadOlder={loadOlder}
          onToggleReaction={toggleReaction}
          onEditMessage={editMessage}
          onDeleteMessage={handleDelete}
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
      {status === "reconnecting" ? (
        <p
          role="status"
          className="bg-surface-hover text-content-muted shrink-0 px-4 py-1 text-center text-xs"
        >
          {CHAT_RECONNECTING_NOTICE}
        </p>
      ) : null}
      <MessageComposer
        channelName={channel.name}
        onSend={sendMessage}
        disabled={!currentAuthor || status !== "ready"}
        canMentionEveryone={canMentionEveryone}
      />
    </>
  );
}
