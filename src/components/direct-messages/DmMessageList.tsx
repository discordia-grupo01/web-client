"use client";

import {
  canDeleteMessage,
  canEditMessage,
  dmConversationStart,
  startsMessageGroup,
  type MessageAuthor,
} from "@discordia/client-shared";

import { useEffect, useRef } from "react";

import { MessageItem } from "@/components/messages/MessageItem";
import { ServerAvatar } from "@/components/ui/ServerAvatar";
import type { DmMessage } from "@/services/conversations/useDirectMessages";

interface DmMessageListProps {
  partner: MessageAuthor;
  currentAuthor: MessageAuthor;
  messages: DmMessage[];
  onToggleReaction: (messageId: string, emoji: string) => void;
  onEditMessage: (messageId: string, content: string) => void;
  onDeleteMessage: (messageId: string) => void;
}

/** Historial de una conversacion directa. Sin moderacion. */
export function DmMessageList({
  partner,
  currentAuthor,
  messages,
  onToggleReaction,
  onEditMessage,
  onDeleteMessage,
}: DmMessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [messages.length]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-2 py-4 md:px-4">
      <div className="mb-6 flex flex-col items-start px-2">
        <ServerAvatar
          name={partner.name}
          src={partner.avatarUrl}
          size={56}
          className="mb-3 rounded-full"
        />
        <h2 className="font-display text-content mb-1 text-xl font-bold">
          {partner.name}
        </h2>
        <p className="text-content-muted text-sm">
          {dmConversationStart(partner.name)}
        </p>
      </div>

      <ol aria-label={`Conversación con ${partner.name}`}>
        {messages.map((message, index) => (
          <li key={message.id}>
            <MessageItem
              message={message}
              author={message.user_id === partner.id ? partner : currentAuthor}
              isGroupStart={startsMessageGroup(messages[index - 1], message)}
              canEdit={canEditMessage(message, currentAuthor.id)}
              canDelete={canDeleteMessage(message, currentAuthor.id, false)}
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
