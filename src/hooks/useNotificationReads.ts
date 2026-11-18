"use client";

import {
  chunkNotificationIds,
  countUnreadNotifications,
  locallyReadTransferIds,
  markAllNotificationsRead,
  markNotificationGroupRead,
  type NotificationHistoryItem,
  notificationGroupKey,
  isNotificationUnread,
  NOTIFICATION_TRANSFERS_READ_MAX_IDS,
  type NotificationReadMarks,
  type NotificationUnreadCheck,
} from "@discordia/client-shared";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  readNotificationReadMarks,
  writeNotificationReadMarks,
} from "@/utils/notificationReads";

export function useNotificationReads(
  userId: string | null,
  items: readonly NotificationHistoryItem[],
  isUnreadInMessaging: NotificationUnreadCheck = () => true,
  syncTransfersRead?: (transferIds: string[]) => void,
) {
  const [marks, setMarks] = useState<NotificationReadMarks>({});
  const reportedTransfers = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (userId) setMarks(readNotificationReadMarks(userId));
  }, [userId]);

  const update = useCallback(
    (change: (current: NotificationReadMarks) => NotificationReadMarks) => {
      if (!userId) return;
      setMarks((current) => {
        const next = change(current);
        if (next !== current) writeNotificationReadMarks(userId, next);
        return next;
      });
    },
    [userId],
  );

  const markGroupRead = useCallback(
    (key: string) => {
      const now = new Date().toISOString();
      const latest = items
        .filter((item) => notificationGroupKey(item) === key)
        .map((item) => item.occurred_at)
        .reduce(
          (max, at) => (Date.parse(at) > Date.parse(max) ? at : max),
          now,
        );
      update((current) => markNotificationGroupRead(current, key, latest));
    },
    [items, update],
  );

  const markChannelRead = useCallback(
    (channelId: string) => markGroupRead(`channel:${channelId}`),
    [markGroupRead],
  );

  const markConversationRead = useCallback(
    (conversationId: string) => markGroupRead(`dm:${conversationId}`),
    [markGroupRead],
  );

  useEffect(() => {
    if (!userId || !syncTransfersRead) return;
    const fresh = locallyReadTransferIds(items, marks).filter(
      (id) => !reportedTransfers.current.has(id),
    );
    if (fresh.length === 0) return;
    fresh.forEach((id) => reportedTransfers.current.add(id));
    chunkNotificationIds(fresh, NOTIFICATION_TRANSFERS_READ_MAX_IDS).forEach(
      (chunk) => syncTransfersRead(chunk),
    );
  }, [userId, items, marks, syncTransfersRead]);

  const markTransferRead = useCallback(
    (transferId: string) => markGroupRead(`transfer:${transferId}`),
    [markGroupRead],
  );

  const markAllRead = useCallback(
    () =>
      update((current) =>
        markAllNotificationsRead(current, items, new Date().toISOString()),
      ),
    [items, update],
  );

  const isUnread = useCallback(
    (item: NotificationHistoryItem) =>
      isNotificationUnread(item, marks) && isUnreadInMessaging(item),
    [marks, isUnreadInMessaging],
  );

  return {
    marks,
    isUnread,
    unreadCount: countUnreadNotifications(items, isUnread),
    markChannelRead,
    markConversationRead,
    markTransferRead,
    markAllRead,
  };
}

export type NotificationReadsState = ReturnType<typeof useNotificationReads>;
