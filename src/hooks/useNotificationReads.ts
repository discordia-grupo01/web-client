"use client";

import {
  countUnreadNotifications,
  markAllNotificationsRead,
  markNotificationGroupRead,
  type NotificationHistoryItem,
  notificationGroupKey,
  isNotificationUnread,
  type NotificationReadMarks,
  type NotificationUnreadCheck,
} from "@discordia/client-shared";

import { useCallback, useEffect, useState } from "react";

import {
  readNotificationReadMarks,
  writeNotificationReadMarks,
} from "@/utils/notificationReads";

export function useNotificationReads(
  userId: string | null,
  items: readonly NotificationHistoryItem[],
  isUnreadInMessaging: NotificationUnreadCheck = () => true,
) {
  const [marks, setMarks] = useState<NotificationReadMarks>({});

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
