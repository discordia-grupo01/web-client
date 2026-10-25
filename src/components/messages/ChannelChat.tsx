"use client";

import {
  type AccessRevokedReason,
  type Channel,
  LOADING_MESSAGES_LABEL,
  type Member,
  messageInputPlaceholder,
  type MessageAuthor,
  type MessageJumpTarget,
  type Role,
  SEND_MESSAGES_DENIED_PLACEHOLDER,
} from "@discordia/client-shared";

import { useEffect, useRef, useState } from "react";

import { useMessageMentionsValue } from "@/hooks/useMessageMentionsValue";
import { useServerMembers } from "@/hooks/useServerMembers";
import { useChannelMessages } from "@/hooks/useChannelMessages";
import { usePendingMessages } from "@/hooks/usePendingMessages";
import { useMessageAuthors } from "@/hooks/useMessageAuthors";

import { ChannelWelcome } from "./ChannelWelcome";
import { ChatStatusNotice } from "./ChatStatusNotice";
import { ConnectionPill } from "./ConnectionPill";
import { ConnectionLostNotice } from "./ConnectionLostNotice";
import { MessageMentionsProvider } from "@/contexts/MentionsContext";
import { MessageComposer } from "./MessageComposer";
import { MessageList } from "./MessageList";
import { ViewingPastBar } from "./ViewingPastBar";

interface ChannelChatProps {
  serverId: string;
  channel: Channel;
  currentAuthor: MessageAuthor | null;
  serverRoles: Role[];
  /** Ids de los roles del usuario actual, para resaltar los mensajes que lo mencionan. */
  myRoleIds: string[];
  canManageMessages: boolean;
  canSendMessages: boolean;
  canMentionEveryone: boolean;
  canAddReactions: boolean;
  isCheckingPermissions?: boolean;
  onAccessRevoked?: (reason: AccessRevokedReason) => void;
  /** Click en el nombre o la foto de un autor (puede ser el usuario actual). */
  onOpenProfile?: (userId: string, member?: Member) => void;
  /** Resultado de busqueda a mostrar en este canal. */
  jumpTarget?: MessageJumpTarget | null;
  /** El salto ya se hizo: quien lo pidio lo descarta para no repetirlo al volver al canal. */
  onJumpHandled?: () => void;
}

export function ChannelChat({
  serverId,
  channel,
  currentAuthor,
  serverRoles,
  myRoleIds,
  canManageMessages,
  canSendMessages,
  canMentionEveryone,
  canAddReactions,
  isCheckingPermissions = false,
  onAccessRevoked,
  onOpenProfile,
  jumpTarget = null,
  onJumpHandled,
}: ChannelChatProps) {
  const {
    status,
    statusMessage,
    messages,
    hasMore,
    isLoadingOlder,
    loadOlder,
    hasNewer,
    isLoadingNewer,
    loadNewer,
    jumpToMessage,
    jumpToPresent,
    focusedMessage,
    retry,
    sendMessage,
    toggleReaction,
    editMessage,
    deleteMessage,
  } = useChannelMessages(channel, currentAuthor?.id ?? null, {
    onAccessRevoked,
  });
  const pending = usePendingMessages({
    chatKey: channel.id,
    channelId: channel.id,
    currentUserId: currentAuthor?.id ?? null,
    isReady: status === "ready",
    send: sendMessage,
  });
  const reconcilePending = pending.reconcile;
  useEffect(() => {
    if (messages) reconcilePending(messages);
  }, [messages, reconcilePending]);
  const members = useServerMembers(serverId);
  const authors = useMessageAuthors(
    members,
    messages,
    currentAuthor,
    serverRoles,
  );
  const [actionError, setActionError] = useState<string | null>(null);

  // Se salta recien con el historial cargado: si no, la primera carga de lo
  // ultimo se mezclaria con el tramo del pasado.
  const isLoaded = messages !== null;
  const handledJump = useRef<number | null>(null);
  useEffect(() => {
    if (!jumpTarget || !isLoaded || handledJump.current === jumpTarget.nonce) {
      return;
    }
    handledJump.current = jumpTarget.nonce;
    onJumpHandled?.();
    setActionError(null);
    void jumpToMessage(jumpTarget.messageId).then((result) => {
      if (!result.ok) setActionError(result.message);
    });
  }, [jumpTarget, isLoaded, jumpToMessage, onJumpHandled]);

  async function handleDelete(messageId: string) {
    setActionError(null);
    const result = await deleteMessage(messageId);
    if (!result.ok) setActionError(result.message);
  }

  async function handleToggleReaction(messageId: string, emoji: string) {
    setActionError(null);
    const result = await toggleReaction(messageId, emoji);
    if (!result.ok) setActionError(result.message);
  }

  const mentions = useMessageMentionsValue({
    members,
    authors,
    serverRoles,
    canMentionEveryone,
    currentUserId: currentAuthor?.id ?? null,
    myRoleIds,
  });

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
    <MessageMentionsProvider value={mentions}>
      {messages !== null ? (
        <ConnectionPill status={status} onRetry={retry} />
      ) : null}
      {messages === null ? (
        status === "offline" ? (
          <ConnectionLostNotice onRetry={retry} />
        ) : (
          <ChatStatusNotice message={LOADING_MESSAGES_LABEL} isLoading />
        )
      ) : (
        <MessageList
          welcome={<ChannelWelcome channelName={channel.name} />}
          label={`Mensajes de #${channel.name}`}
          messages={hasNewer ? messages : pending.withPending(messages)}
          authors={authors}
          currentUserId={currentAuthor?.id ?? null}
          canManageMessages={canManageMessages}
          canSendMessages={canSendMessages}
          canAddReactions={canAddReactions}
          hasMore={hasMore}
          isLoadingOlder={isLoadingOlder}
          onLoadOlder={loadOlder}
          hasNewer={hasNewer}
          isLoadingNewer={isLoadingNewer}
          onLoadNewer={loadNewer}
          focusedMessage={focusedMessage}
          onToggleReaction={handleToggleReaction}
          onEditMessage={editMessage}
          onDeleteMessage={handleDelete}
          onRetryMessage={pending.retry}
          onDiscardMessage={pending.discard}
          onOpenProfile={
            onOpenProfile
              ? (userId) =>
                  onOpenProfile(
                    userId,
                    members?.find((member) => member.user_id === userId),
                  )
              : undefined
          }
        />
      )}
      {hasNewer && messages !== null ? (
        <ViewingPastBar onJumpToPresent={jumpToPresent} />
      ) : null}
      {actionError ? (
        <p
          role="alert"
          className="bg-danger/10 text-danger shrink-0 px-4 py-1 text-center text-xs"
        >
          {actionError}
        </p>
      ) : null}
      <MessageComposer
        placeholder={
          canSendMessages || isCheckingPermissions
            ? messageInputPlaceholder(channel.name)
            : SEND_MESSAGES_DENIED_PLACEHOLDER
        }
        onSend={(...args) => {
          // Lo propio llega por el socket, que no agrega nada mientras se ve el pasado.
          jumpToPresent();
          return pending.onSend(...args);
        }}
        uploadTarget={{ channelId: channel.id }}
        disabled={
          !currentAuthor ||
          !canSendMessages ||
          !(
            status === "ready" ||
            status === "reconnecting" ||
            status === "offline"
          )
        }
      />
    </MessageMentionsProvider>
  );
}
