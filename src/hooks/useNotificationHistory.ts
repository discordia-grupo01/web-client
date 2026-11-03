"use client";

import {
  appendNotificationHistory,
  NOTIFICATION_HISTORY_PAGE_SIZE,
  type NotificationHistoryItem,
} from "@discordia/client-shared";

import { useCallback, useEffect, useRef, useState } from "react";

import { listNotificationHistoryRequest } from "@/services/notifications/client";

export type NotificationHistoryStatus = "loading" | "ready" | "error";

export function useNotificationHistory() {
  const [items, setItems] = useState<NotificationHistoryItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [status, setStatus] = useState<NotificationHistoryStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const generation = useRef(0);
  const isFetchingMore = useRef(false);
  const knownIds = useRef<ReadonlySet<string>>(new Set());

  useEffect(() => {
    knownIds.current = new Set(items.map((entry) => entry.message_id));
  }, [items]);

  const reload = useCallback(() => {
    const current = ++generation.current;
    isFetchingMore.current = false;
    setIsLoadingMore(false);
    setLoadMoreError(null);
    setError(null);
    setStatus("loading");

    return listNotificationHistoryRequest({
      limit: NOTIFICATION_HISTORY_PAGE_SIZE,
    }).then((result) => {
      if (current !== generation.current) return;
      if (result.ok) {
        setItems(result.items);
        setNextCursor(result.nextCursor);
        setStatus("ready");
      } else {
        setError(result.message);
        setStatus("error");
      }
    });
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const loadMore = useCallback(() => {
    if (status !== "ready" || !nextCursor || isFetchingMore.current) return;

    const current = generation.current;
    isFetchingMore.current = true;
    setIsLoadingMore(true);
    setLoadMoreError(null);

    void listNotificationHistoryRequest({
      limit: NOTIFICATION_HISTORY_PAGE_SIZE,
      before: nextCursor,
    }).then((result) => {
      if (current !== generation.current) return;
      isFetchingMore.current = false;
      setIsLoadingMore(false);
      if (result.ok) {
        setItems((previous) =>
          appendNotificationHistory(previous, result.items),
        );
        setNextCursor(result.nextCursor);
      } else {
        setLoadMoreError(result.message);
      }
    });
  }, [status, nextCursor]);

  const refresh = useCallback((): Promise<boolean> => {
    if (status !== "ready") return reload().then(() => false);

    const current = generation.current;
    return listNotificationHistoryRequest({
      limit: NOTIFICATION_HISTORY_PAGE_SIZE,
    }).then((result) => {
      if (current !== generation.current || !result.ok) return false;
      const hasNew = result.items.some(
        (entry) => !knownIds.current.has(entry.message_id),
      );
      setItems((previous) => appendNotificationHistory(result.items, previous));
      return hasNew;
    });
  }, [status, reload]);

  return {
    items,
    status,
    error,
    hasMore: nextCursor !== null,
    isLoadingMore,
    loadMoreError,
    loadMore,
    reload,
    refresh,
  };
}

export type NotificationHistoryState = ReturnType<
  typeof useNotificationHistory
>;
