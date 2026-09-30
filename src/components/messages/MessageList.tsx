"use client";

import {
  canDeleteMessage,
  canEditMessage,
  startsMessageGroup,
  type Message,
  type MessageAuthor,
} from "@discordia/client-shared";

import { useEffect, useRef } from "react";

import type { MentionResolver } from "./MessageContent";
import { ChannelWelcome } from "./ChannelWelcome";
import { MessageItem } from "./MessageItem";

interface MessageListProps {
  channelName: string;
  messages: Message[];
  authors: Record<string, MessageAuthor>;
  currentUserId: string | null;
  canManageMessages: boolean;
  resolveMention?: MentionResolver;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onEditMessage: (messageId: string, content: string) => void;
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
  resolveMention,
  onToggleReaction,
  onEditMessage,
  onDeleteMessage,
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
              canEdit={
                currentUserId !== null &&
                canEditMessage(message, currentUserId)
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
