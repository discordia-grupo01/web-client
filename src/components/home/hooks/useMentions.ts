"use client";

import {
  addUnreadMention,
  clearChannelMentions,
  filterHighlightedMentions,
  type MentionEventPayload,
  mergeUnreadMentions,
  NO_NOTIFICATION_SETTINGS,
  NO_UNREAD_MENTIONS,
  type NotificationSettings,
  type UnreadMentions,
  unreadByChannel,
  unreadByServer,
  withoutSuspendedEntries,
} from "@discordia/client-shared";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  listUnreadMentionsRequest,
  markChannelMentionsReadRequest,
} from "@/services/mentions/client";

const NO_SUSPENDED: ReadonlySet<string> = new Set();

/**
 * Menciones sin leer de la sesion, para los contadores de canales y servidores.
 *
 * - Al montar y al reconectar se piden con `GET /v1/mentions`, que es como se
 *   enteran quienes estaban desconectados (o recargaron la pagina): el estado
 *   vive en el back, no solo en memoria.
 * - En vivo llegan por el evento `mention` de la sala personal; `receive` se
 *   le pasa a `useDirectMessages`, que es quien esta unido a esa sala.
 * - Abrir un canal las marca como leidas (`markChannelRead`).
 * - Las de un servidor suspendido no cuentan mientras dure, pero se conservan.
 */
export function useMentions(
  currentUserId: string | null,
  settings: NotificationSettings = NO_NOTIFICATION_SETTINGS,
  suspendedServerIds: ReadonlySet<string> = NO_SUSPENDED,
) {
  const [unread, setUnread] = useState<UnreadMentions>(NO_UNREAD_MENTIONS);
  const [isLoaded, setIsLoaded] = useState(false);

  const reload = useCallback(
    () =>
      listUnreadMentionsRequest()
        .then((result) => {
          if (result.ok) {
            setUnread((prev) => mergeUnreadMentions(prev, result.mentions));
          }
        })
        .finally(() => setIsLoaded(true)),
    [],
  );

  useEffect(() => {
    if (currentUserId) void reload();
  }, [currentUserId, reload]);

  const receive = useCallback(
    (payload: MentionEventPayload) =>
      setUnread((prev) => addUnreadMention(prev, payload)),
    [],
  );

  const markChannelRead = useCallback((channelId: string) => {
    setUnread((prev) => clearChannelMentions(prev, channelId));
    void markChannelMentionsReadRequest(channelId);
  }, []);

  const isUnread = useCallback(
    (messageId: string) => messageId in unread,
    [unread],
  );

  const visible = useMemo(
    () => withoutSuspendedEntries(unread, suspendedServerIds),
    [unread, suspendedServerIds],
  );
  const highlighted = useMemo(
    () => filterHighlightedMentions(visible, settings),
    [visible, settings],
  );
  const byChannel = useMemo(() => unreadByChannel(highlighted), [highlighted]);
  const byServer = useMemo(() => unreadByServer(highlighted), [highlighted]);
  const hasUnread = Object.keys(visible).length > 0;

  const markAllRead = useCallback(async () => {
    const channelIds = Object.keys(unreadByChannel(visible));
    const results = await Promise.all(
      channelIds.map((channelId) => markChannelMentionsReadRequest(channelId)),
    );
    const read = channelIds.filter((_, index) => results[index]?.ok);
    if (read.length > 0) {
      setUnread((prev) => read.reduce(clearChannelMentions, prev));
    }
    return read.length === channelIds.length;
  }, [visible]);

  return {
    byChannel,
    byServer,
    hasUnread,
    isLoaded,
    isUnread,
    receive,
    reload,
    markChannelRead,
    markAllRead,
  };
}
