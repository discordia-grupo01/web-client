"use client";

import type { ServerEmoji, ServerEmojiPage } from "@discordia/client-shared";
import { useCallback, useEffect, useState } from "react";

import { useRefreshOnChange } from "@/hooks/useRefreshOnChange";
import { listServerEmojisRequest } from "@/services/emojis/client";

export function useServerEmojis(serverId: string | null) {
  const [page, setPage] = useState<ServerEmojiPage | null>(null);
  const [error, setError] = useState<string>();

  const load = useCallback(async () => {
    if (serverId === null) return;
    const result = await listServerEmojisRequest(serverId);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setError(undefined);
    setPage(result.page);
  }, [serverId]);

  useEffect(() => {
    void load();
  }, [load]);

  useRefreshOnChange({ resources: ["emojis"], serverId }, load, {
    enabled: serverId !== null,
  });

  const addEmoji = useCallback((emoji: ServerEmoji) => {
    setPage((current) =>
      current === null ||
      current.emojis.some((existing) => existing.id === emoji.id)
        ? current
        : { ...current, emojis: [...current.emojis, emoji] },
    );
  }, []);

  const removeEmoji = useCallback((emojiId: string) => {
    setPage((current) =>
      current === null
        ? current
        : {
            ...current,
            emojis: current.emojis.filter((emoji) => emoji.id !== emojiId),
          },
    );
  }, []);

  return { page, error, reload: load, addEmoji, removeEmoji };
}
