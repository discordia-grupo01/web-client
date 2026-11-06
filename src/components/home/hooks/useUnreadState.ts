"use client";

import {
  createUnreadTracker,
  hasAnyUnread,
  NO_UNREAD,
  unreadFlagsByChannel,
  unreadFlagsByServer,
  type UnreadState,
  type UnreadTracker,
} from "@discordia/client-shared";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  connectUnread,
  type UnreadConnection,
} from "@/services/notifications/socket";

export function useUnreadState(
  userId: string | null,
  openChannelId: string | null,
) {
  const [state, setState] = useState<UnreadState>(NO_UNREAD);
  const openChannelRef = useRef(openChannelId);
  const trackerRef = useRef<UnreadTracker | null>(null);

  useEffect(() => {
    if (!userId) return;
    let connection: UnreadConnection | null = null;
    const tracker = createUnreadTracker({
      markRead: (channelId) => connection?.markRead(channelId),
      markAllRead: () => connection?.markAllRead() ?? Promise.resolve(false),
      onChange: setState,
    });
    tracker.setOpenChannel(openChannelRef.current);
    connection = connectUnread(userId, {
      snapshot: tracker.applySnapshot,
      updated: tracker.applyUpdate,
    });
    trackerRef.current = tracker;
    return () => {
      connection.disconnect();
      trackerRef.current = null;
      setState(NO_UNREAD);
    };
  }, [userId]);

  useEffect(() => {
    openChannelRef.current = openChannelId;
    trackerRef.current?.setOpenChannel(openChannelId);
  }, [openChannelId]);

  const byChannel = useMemo(() => unreadFlagsByChannel(state), [state]);
  const byServer = useMemo(() => unreadFlagsByServer(state), [state]);
  const hasUnread = hasAnyUnread(state);

  const markAllRead = useCallback(
    () => trackerRef.current?.markAllRead() ?? Promise.resolve(false),
    [],
  );

  return { byChannel, byServer, hasUnread, markAllRead };
}
