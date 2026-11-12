"use client";

import {
  createUnreadTracker,
  hasAnyUnread,
  NO_UNREAD,
  unreadFlagsByChannel,
  unreadFlagsByServer,
  type UnreadState,
  type UnreadTracker,
  withoutSuspendedEntries,
} from "@discordia/client-shared";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { changeBus } from "@/lib/changeBus";
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
  const [statusRevision, setStatusRevision] = useState(0);
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
    let snapshots = 0;
    connection = connectUnread(userId, {
      snapshot: (payload) => {
        tracker.applySnapshot(payload);
        snapshots += 1;
        if (snapshots > 1) changeBus.refreshAll();
      },
      changed: changeBus.publish,
      updated: tracker.applyUpdate,
      statusChanged: () => setStatusRevision((revision) => revision + 1),
    });
    trackerRef.current = tracker;
    return () => {
      connection.disconnect();
      trackerRef.current = null;
      setState(NO_UNREAD);
      setStatusRevision(0);
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
  const hasUnread = hasAnyUnread(visible);

  const markAllRead = useCallback(
    () => trackerRef.current?.markAllRead() ?? Promise.resolve(false),
    [],
  );

  const markServerRead = useCallback(
    (serverId: string) => {
      if (suspendedServerIds.has(serverId)) return [];
      return trackerRef.current?.markServerRead(serverId) ?? [];
    },
    [suspendedServerIds],
  );

  return {
    byChannel,
    byServer,
    hasUnread,
    markAllRead,
    markServerRead,
    statusRevision,
  };
}
