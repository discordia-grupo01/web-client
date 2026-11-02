"use client";

import {
  chunkNotificationIds,
  type Message,
  type NotificationHistoryItem,
} from "@discordia/client-shared";

import { useEffect, useRef, useState } from "react";

import { lookupMessagesRequest } from "@/services/messages/client";

export function useNotificationMessages(
  items: readonly NotificationHistoryItem[],
): Record<string, Message | null> {
  const [messages, setMessages] = useState<Record<string, Message | null>>({});
  const requested = useRef(new Set<string>());
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const missing = items
      .map((item) => item.message_id)
      .filter((id) => !requested.current.has(id));
    missing.forEach((id) => requested.current.add(id));

    chunkNotificationIds(missing).forEach((chunk) => {
      void lookupMessagesRequest(chunk).then((result) => {
        if (!isMounted.current) return;
        if (!result.ok) {
          chunk.forEach((id) => requested.current.delete(id));
          return;
        }
        const found = new Map(
          result.messages.map((message) => [message.id, message]),
        );
        setMessages((previous) => {
          const next = { ...previous };
          chunk.forEach((id) => {
            next[id] = found.get(id) ?? null;
          });
          return next;
        });
      });
    });
  }, [items]);

  return messages;
}
