"use client";

import {
  activeConversationSummary,
  applyNewDm,
  conversationReadKey,
  conversationSummaries,
  DM_SEND_FAILED,
  type DirectConversation,
  type ListConversationsResult,
  joinUserChannel,
  type MessageAuthor,
  messageAuthorOf,
  type NewDmPayload,
  partnerIdsMissingProfile,
  sendDirectMessage,
  type SendDmResult,
  type UserRoomCallbacks,
  withLocalReads,
} from "@discordia/client-shared";

import type { Channel as PhoenixChannel } from "phoenix";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { avatarSrcOf } from "@/lib/userProfile";
import { useBlockedUsersContext } from "@/services/blocks/BlockedUsersContext";
import { acquireSocket } from "@/services/messages/socket";
import { getPublicProfileRequest } from "@/services/profile/client";

import {
  listConversationsRequest,
  markConversationReadRequest,
} from "./client";

export type {
  ConversationSummary,
  SendDmResult,
} from "@discordia/client-shared";

/**
 * Mensajes directos de la sesion actual: la lista de conversaciones, la
 * conversacion abierta y el envio.
 *
 * - La lista sale de `GET /v1/conversations` y se mantiene viva con el evento
 *   `new_dm` de la sala personal `user:<id>` (tambien llega a quien todavia no
 *   tenia la conversacion). Al re-unirse tras un corte se vuelve a pedir, que es
 *   como se ven los mensajes recibidos sin conexion.
 * - El historial, editar y borrar de la conversacion abierta son los de un canal
 *   (`useChannelMessages` con el id de la conversacion), en `DmHistory`.
 * - Enviar es `send_dm` por la sala personal (`sendDirectMessage`).
 * - "Bloqueado" sale de los bloqueos del usuario (`BlockedUsersContext`).
 *
 * `isViewActive`: solo con la vista de mensajes directos a la vista se marca
 * como leida la conversacion abierta.
 *
 * Esta es la unica sala `user:<id>` de la sesion, asi que tambien le entrega a
 * quien lo pida los eventos `mention` y avisa cuando se vuelve a unir tras un
 * corte (`callbacks`).
 */
export function useDirectMessages(
  currentAuthor: MessageAuthor | null,
  isViewActive: boolean,
  callbacks: UserRoomCallbacks = {},
) {
  const currentUserId = currentAuthor?.id ?? null;
  const { blockedIds } = useBlockedUsersContext();
  const [conversations, setConversations] = useState<DirectConversation[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [partners, setPartners] = useState<Record<string, MessageAuthor>>({});
  const [activePartnerId, setActivePartnerId] = useState<string | null>(null);

  const userRoom = useRef<PhoenixChannel | null>(null);
  const isJoined = useRef(false);
  const requestedProfiles = useRef(new Set<string>());
  const callbacksRef = useRef(callbacks);
  useEffect(() => {
    callbacksRef.current = callbacks;
  });

  const applyList = useCallback((result: ListConversationsResult) => {
    if (result.ok) setConversations(result.conversations);
    setLoadError(result.ok ? null : result.message);
    setIsLoading(false);
  }, []);

  const reload = useCallback(
    () => listConversationsRequest().then(applyList),
    [applyList],
  );

  const applyDm = useCallback(
    (payload: NewDmPayload) =>
      setConversations((prev) => applyNewDm(prev, payload, currentUserId)),
    [currentUserId],
  );

  useEffect(() => {
    if (!currentUserId) return;
    let cancelled = false;
    let release: (() => void) | null = null;
    let room: PhoenixChannel | null = null;

    void listConversationsRequest().then(applyList);

    async function start() {
      const acquired = await acquireSocket();
      if (cancelled) {
        if (acquired.ok) acquired.release();
        return;
      }
      // Sin socket la lista igual se ve (REST), pero no se puede enviar.
      if (!acquired.ok) return;
      release = acquired.release;

      room = acquired.socket.channel(`user:${currentUserId}`);
      userRoom.current = room;
      joinUserChannel(room, {
        newDm: applyDm,
        mention: (payload) => callbacksRef.current.onMention?.(payload),
        connectionLost: () => {
          isJoined.current = false;
        },
        joined: (isFirstJoin) => {
          isJoined.current = true;
          if (!isFirstJoin) {
            void reload();
            callbacksRef.current.onRejoined?.();
          }
        },
      });
    }
    void start();

    return () => {
      cancelled = true;
      isJoined.current = false;
      userRoom.current = null;
      room?.leave();
      release?.();
    };
  }, [currentUserId, reload, applyList, applyDm]);

  // El back solo devuelve ids: nombre y foto se piden una vez por usuario.
  useEffect(() => {
    const missing = partnerIdsMissingProfile(
      conversations,
      partners,
      requestedProfiles.current,
    );
    missing.forEach((id) => requestedProfiles.current.add(id));

    for (const id of missing) {
      void getPublicProfileRequest(id).then((result) => {
        if (!result.ok) return;
        const { name, avatar_url } = result.user;
        setPartners((prev) => ({
          ...prev,
          [id]: messageAuthorOf(
            id,
            name,
            avatarSrcOf(id, { name, avatar_url }),
          ),
        }));
      });
    }
  }, [conversations, partners]);

  const [readKeys, setReadKeys] = useState<ReadonlySet<string>>(new Set());

  const summaries = useMemo(
    () =>
      withLocalReads(
        conversationSummaries(conversations, partners, blockedIds),
        readKeys,
      ),
    [conversations, partners, blockedIds, readKeys],
  );

  const activeSummary = useMemo(
    () =>
      activePartnerId
        ? activeConversationSummary(
            activePartnerId,
            summaries,
            partners,
            blockedIds,
          )
        : null,
    [activePartnerId, summaries, partners, blockedIds],
  );

  // Abrir una conversacion (o recibir un mensaje con ella abierta) la marca leida.
  const activeUnreadId =
    isViewActive && activeSummary?.isUnread === true
      ? activeSummary.conversationId
      : null;
  const activeLastMessageId = activeSummary?.lastMessage?.id;
  useEffect(() => {
    if (!activeUnreadId) return;
    void markConversationReadRequest(activeUnreadId).then((result) => {
      if (!result.ok) return;
      const key = conversationReadKey(activeUnreadId, activeLastMessageId);
      setReadKeys((prev) => new Set(prev).add(key));
    });
  }, [activeUnreadId, activeLastMessageId]);

  /**
   * Abre la conversacion con `partnerId`. Si nunca hablaron no se crea nada
   * todavia: queda un borrador que el back convierte en conversacion con el
   * primer mensaje. `partner` evita pedir el perfil de quien se eligio de la lista.
   */
  const openConversation = useCallback(
    (partnerId: string, partner?: MessageAuthor) => {
      if (partner) {
        setPartners((prev) => ({ ...prev, [partnerId]: partner }));
      }
      setActivePartnerId(partnerId);
    },
    [],
  );

  const sendMessage = useCallback(
    (content: string): Promise<SendDmResult> => {
      if (!activePartnerId) {
        return Promise.resolve({ ok: false, message: DM_SEND_FAILED });
      }
      return sendDirectMessage(
        userRoom.current,
        isJoined.current,
        activePartnerId,
        content,
        (sent) =>
          applyDm({
            conversation_id: sent.conversation_id,
            partner_id: activePartnerId,
            message: sent.message,
          }),
      );
    },
    [activePartnerId, applyDm],
  );

  return {
    conversations: summaries,
    isLoading,
    loadError,
    reload,
    activeSummary,
    openConversation,
    sendMessage,
  };
}
