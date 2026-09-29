"use client";

import type { Channel, MessageAuthor } from "@discordia/client-shared";

import { useChannelMessages } from "@/services/messages/use-channel-messages";

import { MessageComposer } from "./message-composer";
import { MessageList } from "./message-list";

interface ChannelChatProps {
  channel: Channel;
  currentAuthor: MessageAuthor | null;
}

export function ChannelChat({ channel, currentAuthor }: ChannelChatProps) {
  const { messages, authors, sendMessage, toggleReaction } = useChannelMessages(
    channel,
    currentAuthor,
  );

  return (
    <>
      <MessageList
        channelName={channel.name}
        messages={messages ?? []}
        authors={authors}
        onToggleReaction={toggleReaction}
      />
      <MessageComposer
        channelName={channel.name}
        onSend={sendMessage}
        disabled={!currentAuthor}
      />
    </>
  );
}
