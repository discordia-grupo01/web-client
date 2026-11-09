"use client";

import { NOTIFICATIONS_MARK_ALL_READ_FAILED } from "@discordia/client-shared";

import { useCallback, useState } from "react";

interface RemoteReads {
  hasUnread: boolean;
  markAllRead: () => Promise<boolean>;
}

interface MarkAllReadSources {
  reads: { unreadCount: number; markAllRead: () => void };
  unread: RemoteReads;
  directMessages: RemoteReads;
}

/**
 * Une las tres lecturas: el historial del centro (local), los canales de los
 * servidores (servicio de notificaciones) y los mensajes directos (messaging).
 * A cada servicio solo se le pregunta si tiene algo sin leer, para no mostrar
 * un error cuando no había nada que apagar.
 */
export function useMarkAllRead({
  reads,
  unread,
  directMessages,
}: MarkAllReadSources) {
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { markAllRead: markHistoryRead } = reads;
  const { hasUnread: hasUnreadChannels, markAllRead: markChannelsRead } =
    unread;
  const { hasUnread: hasUnreadDirect, markAllRead: markDirectRead } =
    directMessages;

  const markAllRead = useCallback(async () => {
    markHistoryRead();
    setError(null);
    const pending = [
      hasUnreadChannels ? markChannelsRead() : null,
      hasUnreadDirect ? markDirectRead() : null,
    ].filter((request) => request !== null);
    if (pending.length === 0) return;
    setIsMarkingAll(true);
    const results = await Promise.all(pending);
    setIsMarkingAll(false);
    if (results.includes(false)) setError(NOTIFICATIONS_MARK_ALL_READ_FAILED);
  }, [
    markHistoryRead,
    hasUnreadChannels,
    markChannelsRead,
    hasUnreadDirect,
    markDirectRead,
  ]);

  const canMarkAllRead =
    !isMarkingAll &&
    (reads.unreadCount > 0 || hasUnreadChannels || hasUnreadDirect);

  return { markAllRead, canMarkAllRead, isMarkingAll, error };
}

export type MarkAllReadState = ReturnType<typeof useMarkAllRead>;
