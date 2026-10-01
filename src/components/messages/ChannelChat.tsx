"use client";

import type { Channel, MessageAuthor, Role } from "@discordia/client-shared";

import { useMemo } from "react";

import { buildMentionResolver } from "@/services/messages/message-mentions";
import { useChannelMessages } from "@/services/messages/useChannelMessages";

import { MessageComposer } from "./MessageComposer";
import { MessageList } from "./MessageList";

interface ChannelChatProps {
  channel: Channel;
  currentAuthor: MessageAuthor | null;
  serverRoles: Role[];
  canManageMessages: boolean;
  canMentionEveryone: boolean;
}

export function ChannelChat({
  channel,
  currentAuthor,
  serverRoles,
  canManageMessages,
  canMentionEveryone,
}: ChannelChatProps) {
  const {
    messages,
    authors,
    sendMessage,
    toggleReaction,
    editMessage,
    deleteMessage,
  } = useChannelMessages(channel, currentAuthor);

  const resolveMention = useMemo(
    () => buildMentionResolver(authors, serverRoles),
    [authors, serverRoles],
  );

  return (
    <>
      <MessageList
        channelName={channel.name}
        messages={messages ?? []}
        authors={authors}
        currentUserId={currentAuthor?.id ?? null}
        canManageMessages={canManageMessages}
        resolveMention={resolveMention}
        onToggleReaction={toggleReaction}
        onEditMessage={editMessage}
        onDeleteMessage={deleteMessage}
      />
      <MessageComposer
        channelName={channel.name}
        onSend={sendMessage}
        disabled={!currentAuthor}
        canMentionEveryone={canMentionEveryone}
      />
    </>
  );
}
