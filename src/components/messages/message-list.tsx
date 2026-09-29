"use client";

import {
  type Message,
  type MessageAuthor,
  startsMessageGroup,
} from "@discordia/client-shared";

import { useEffect, useRef } from "react";

import { ChannelWelcome } from "./channel-welcome";
import { MessageItem } from "./message-item";

interface MessageListProps {
  channelName: string;
  messages: Message[];
  authors: Record<string, MessageAuthor>;
  onToggleReaction: (messageId: string, emoji: string) => void;
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
  onToggleReaction,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [messages.length]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-2 py-4 md:px-4">
      <ChannelWelcome channelName={channelName} />

      <ol aria-label={`Mensajes de #${channelName}`}>
        {messages.map((message, index) => (
          <li key={message.id}>
            <MessageItem
              message={message}
              author={
                authors[message.author_id] ?? unknownAuthor(message.author_id)
              }
              isGroupStart={startsMessageGroup(messages[index - 1], message)}
              onToggleReaction={(emoji) => onToggleReaction(message.id, emoji)}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}
