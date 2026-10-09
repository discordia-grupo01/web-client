"use client";

import {
  addUnreadMention,
  clearChannelMentions,
  type MentionEventPayload,
  mergeUnreadMentions,
  NO_UNREAD_MENTIONS,
  type UnreadMentions,
  unreadByChannel,
  unreadByServer,
} from "@discordia/client-shared";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  listUnreadMentionsRequest,
  markChannelMentionsReadRequest,
} from "./client";

/**
 * Menciones sin leer de la sesion, para los contadores de canales y servidores.
 *
 * - Al montar y al reconectar se piden con `GET /v1/mentions`, que es como se
 *   enteran quienes estaban desconectados (o recargaron la pagina): el estado
 *   vive en el back, no solo en memoria.
 * - En vivo llegan por el evento `mention` de la sala personal; `receive` se
 *   le pasa a `useDirectMessages`, que es quien esta unido a esa sala.
 * - Abrir un canal las marca como leidas (`markChannelRead`).
 */
export function useMentions(currentUserId: string | null) {
  const [unread, setUnread] = useState<UnreadMentions>(NO_UNREAD_MENTIONS);

  const reload = useCallback(
    () =>
      listUnreadMentionsRequest().then((result) => {
        if (result.ok) {
          setUnread((prev) => mergeUnreadMentions(prev, result.mentions));
        }
      }),
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

  const byChannel = useMemo(() => unreadByChannel(unread), [unread]);
  const byServer = useMemo(() => unreadByServer(unread), [unread]);

  return { byChannel, byServer, receive, reload, markChannelRead };
}
