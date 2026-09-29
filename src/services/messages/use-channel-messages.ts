"use client";

import {
  type Channel,
  type Message,
  type MessageAuthor,
  toggleReaction as toggleReactionIn,
  validateMessageContent,
} from "@discordia/client-shared";

import { useCallback, useEffect, useMemo, useState } from "react";

import { DEMO_AUTHORS } from "./mock-data";
import {
  createLocalMessage,
  loadChannelMessages,
  saveChannelMessages,
} from "./mock-store";

interface ChannelMessages {
  messages: Message[] | null;
  authors: Record<string, MessageAuthor>;
  sendMessage: (content: string) => void;
  toggleReaction: (messageId: string, emoji: string) => void;
}

export function useChannelMessages(
  channel: Pick<Channel, "id" | "name">,
  currentAuthor: MessageAuthor | null,
): ChannelMessages {
  const [messages, setMessages] = useState<Message[] | null>(null);

  useEffect(() => {
    setMessages(loadChannelMessages(channel.id, channel.name));
  }, [channel.id, channel.name]);

  useEffect(() => {
    if (messages) saveChannelMessages(channel.id, messages);
  }, [channel.id, messages]);

  const authors = useMemo(
    () =>
      currentAuthor
        ? { ...DEMO_AUTHORS, [currentAuthor.id]: currentAuthor }
        : DEMO_AUTHORS,
    [currentAuthor],
  );

  const sendMessage = useCallback(
    (content: string) => {
      if (!currentAuthor || validateMessageContent(content)) return;
      const message = createLocalMessage(channel.id, currentAuthor.id, content);
      setMessages((prev) => (prev ? [...prev, message] : [message]));
    },
    [channel.id, currentAuthor],
  );

  const toggleReaction = useCallback((messageId: string, emoji: string) => {
    setMessages(
      (prev) =>
        prev?.map((message) =>
          message.id === messageId
            ? {
                ...message,
                reactions: toggleReactionIn(message.reactions, emoji),
              }
            : message,
        ) ?? null,
    );
  }, []);

  return { messages, authors, sendMessage, toggleReaction };
}
