"use client";

import {
  type AccessRevokedReason,
  authorFromMember,
  buildMentionResolver,
  type Channel,
  LOADING_MESSAGES_LABEL,
  type MentionSources,
  messageInputPlaceholder,
  type MessageAuthor,
  type Role,
  SEND_MESSAGES_DENIED_PLACEHOLDER,
} from "@discordia/client-shared";

import { useEffect, useMemo, useState } from "react";

import { avatarSrcOf } from "@/lib/userProfile";
import { useServerMembers } from "@/services/members/useServerMembers";
import { useChannelMessages } from "@/services/messages/useChannelMessages";
import { usePendingMessages } from "@/services/messages/usePendingMessages";
import { useMessageAuthors } from "@/services/messages/useMessageAuthors";

import { ChannelWelcome } from "./ChannelWelcome";
import { ChatStatusNotice } from "./ChatStatusNotice";
import { ConnectionPill } from "./ConnectionPill";
import { ConnectionLostNotice } from "./ConnectionLostNotice";
import {
  MessageMentionsProvider,
  type MessageMentionsValue,
} from "./MentionsContext";
import { MessageComposer } from "./MessageComposer";
import { MessageList } from "./MessageList";

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
  const authors = useMessageAuthors(members, messages, currentAuthor);
  const [actionError, setActionError] = useState<string | null>(null);

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

  const currentUserId = currentAuthor?.id ?? null;
  const mentions = useMemo<MessageMentionsValue>(() => {
    const sources: MentionSources = {
      members: (members ?? []).map((member) =>
        authorFromMember(member, avatarSrcOf(member.user_id, member.profile)),
      ),
      roles: serverRoles,
      canMentionEveryone,
    };
    return {
      resolveMention: buildMentionResolver(authors, serverRoles),
      sources,
      me: { userId: currentUserId, roleIds: myRoleIds },
    };
  }, [
    authors,
    members,
    serverRoles,
    canMentionEveryone,
    currentUserId,
    myRoleIds,
  ]);

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
          messages={pending.withPending(messages)}
          authors={authors}
          currentUserId={currentAuthor?.id ?? null}
          canManageMessages={canManageMessages}
          canSendMessages={canSendMessages}
          canAddReactions={canAddReactions}
          hasMore={hasMore}
          isLoadingOlder={isLoadingOlder}
          onLoadOlder={loadOlder}
          onToggleReaction={handleToggleReaction}
          onEditMessage={editMessage}
          onDeleteMessage={handleDelete}
          onRetryMessage={pending.retry}
          onDiscardMessage={pending.discard}
        />
      )}
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
        onSend={pending.onSend}
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
