"use client";

import { NOTIFICATIONS_MARK_ALL_READ_FAILED } from "@discordia/client-shared";

import { useCallback, useState } from "react";

interface MarkAllReadSources {
  reads: { unreadCount: number; markAllRead: () => void };
  unread: { hasUnread: boolean; markAllRead: () => Promise<boolean> };
}

/**
 * Une las dos lecturas: el historial del centro (local) y los canales de los
 * servidores (servicio de notificaciones). Al servidor solo se le pregunta si
 * hay canales sin leer, para no mostrar un error cuando no había nada que apagar.
 */
export function useMarkAllRead({ reads, unread }: MarkAllReadSources) {
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { markAllRead: markHistoryRead } = reads;
  const { hasUnread: hasUnreadChannels, markAllRead: markChannelsRead } =
    unread;

  const markAllRead = useCallback(async () => {
    markHistoryRead();
    setError(null);
    if (!hasUnreadChannels) return;
    setIsMarkingAll(true);
    const ok = await markChannelsRead();
    setIsMarkingAll(false);
    if (!ok) setError(NOTIFICATIONS_MARK_ALL_READ_FAILED);
  }, [markHistoryRead, hasUnreadChannels, markChannelsRead]);

  const canMarkAllRead =
    !isMarkingAll && (reads.unreadCount > 0 || hasUnreadChannels);

  return { markAllRead, canMarkAllRead, isMarkingAll, error };
}

export type MarkAllReadState = ReturnType<typeof useMarkAllRead>;
