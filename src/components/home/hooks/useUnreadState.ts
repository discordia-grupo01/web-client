"use client";

import {
  createUnreadTracker,
  NO_UNREAD,
  unreadFlagsByChannel,
  unreadFlagsByServer,
  type UnreadState,
  type UnreadTracker,
  withoutSuspendedEntries,
} from "@discordia/client-shared";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  connectUnread,
  type UnreadConnection,
} from "@/services/notifications/socket";

const NO_SUSPENDED: ReadonlySet<string> = new Set();

/**
 * No leidos por canal y por servidor. Lo de un servidor suspendido no se
 * muestra, pero se conserva: al reactivarlo vuelve sin pedir nada.
 */
export function useUnreadState(
  userId: string | null,
  openChannelId: string | null,
  suspendedServerIds: ReadonlySet<string> = NO_SUSPENDED,
) {
  const [state, setState] = useState<UnreadState>(NO_UNREAD);
  const openChannelRef = useRef(openChannelId);
  const trackerRef = useRef<UnreadTracker | null>(null);

  useEffect(() => {
    if (!userId) return;
    let connection: UnreadConnection | null = null;
    const tracker = createUnreadTracker({
      markRead: (channelId) => connection?.markRead(channelId),
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

  const visible = useMemo(
    () => withoutSuspendedEntries(state, suspendedServerIds),
    [state, suspendedServerIds],
  );
  const byChannel = useMemo(() => unreadFlagsByChannel(visible), [visible]);
  const byServer = useMemo(() => unreadFlagsByServer(visible), [visible]);

  return { byChannel, byServer };
}
