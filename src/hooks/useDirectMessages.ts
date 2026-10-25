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
  markConversationReadIn,
  mergeConversations,
  type MessageAuthor,
  messageAuthorOf,
  type NewDmPayload,
  pushToChannel,
  partnerIdsMissingProfile,
  sendDirectMessage,
  type SendDmResult,
  type UserRoomCallbacks,
  type UserRoomPush,
  unknownAuthor,
  withActiveRead,
  withDraftConversations,
  withLocalReads,
} from "@discordia/client-shared";

import type { Channel as PhoenixChannel } from "phoenix";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { avatarSrcOf } from "@/utils/userProfile";
import { useBlockedUsersContext } from "@/contexts/BlockedUsersContext";
import { acquireSocket } from "@/services/messages/socket";
import { getPublicProfileRequest } from "@/services/profile/client";

import {
  listConversationsRequest,
  markConversationReadRequest,
} from "@/services/conversations/client";

export type {
  ConversationSummary,
  SendDmResult,
} from "@discordia/client-shared";

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
  // Cada reintento vuelve a abrir la sala personal (el socket pudo haberse rendido).
  const [attempt, setAttempt] = useState(0);

  const userRoom = useRef<PhoenixChannel | null>(null);
  const isJoined = useRef(false);
  const [isConnected, setIsConnected] = useState(false);
  const requestedProfiles = useRef(new Set<string>());
  const callbacksRef = useRef(callbacks);
  useEffect(() => {
    callbacksRef.current = callbacks;
  });

  const applyList = useCallback((result: ListConversationsResult) => {
    if (result.ok) {
      setConversations((prev) =>
        mergeConversations(prev, result.conversations),
      );
    }
    setLoadError(result.ok ? null : result.message);
    setIsLoading(false);
  }, []);

  const reload = useCallback(
    () => listConversationsRequest().then(applyList),
    [applyList],
  );

  /** Vuelve a pedir la lista y a unir la sala de DMs, que no se reabre sola tras rendirse. */
  const retry = useCallback(() => {
    setAttempt((value) => value + 1);
    return reload();
  }, [reload]);

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

    if (attempt === 0) void listConversationsRequest().then(applyList);

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
        presenceUpdated: (entry) =>
          callbacksRef.current.onPresenceUpdated?.(entry),
        ownStatusUpdated: (payload) =>
          callbacksRef.current.onOwnStatusUpdated?.(payload),
        connectionLost: () => {
          isJoined.current = false;
          setIsConnected(false);
          callbacksRef.current.onConnectionLost?.();
        },
        joined: (isFirstJoin, reply) => {
          isJoined.current = true;
          setIsConnected(true);
          callbacksRef.current.onJoined?.(reply);
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
      setIsConnected(false);
      room?.leave();
      release?.();
    };
  }, [currentUserId, reload, applyList, applyDm, attempt]);

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
        // Si falla igual se da por resuelto: sin esto el spinner no termina.
        const author = result.ok
          ? messageAuthorOf(
              id,
              result.user.name,
              avatarSrcOf(id, {
                name: result.user.name,
                avatar_url: result.user.avatar_url,
              }),
            )
          : unknownAuthor(id);
        setPartners((prev) => ({ ...prev, [id]: author }));
      });
    }
  }, [conversations, partners]);

  const [draftPartnerIds, setDraftPartnerIds] = useState<string[]>([]);
  const [readKeys, setReadKeys] = useState<ReadonlySet<string>>(new Set());

  const summaries = useMemo(() => {
    const listed = withLocalReads(
      conversationSummaries(conversations, partners, blockedIds),
      readKeys,
    );
    return withDraftConversations(
      isViewActive ? withActiveRead(listed, activePartnerId) : listed,
      draftPartnerIds,
      partners,
      blockedIds,
    );
  }, [
    conversations,
    partners,
    blockedIds,
    readKeys,
    draftPartnerIds,
    isViewActive,
    activePartnerId,
  ]);

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
  const activeConversation = isViewActive
    ? conversations.find((c) => c.partner_id === activePartnerId)
    : undefined;
  const activeUnreadId = activeConversation?.unread
    ? activeConversation.id
    : null;
  const activeLastMessageId = activeConversation?.last_message?.id;

  // Se ve leida al instante (se ajusta durante el render): si se cambia de chat
  // antes de que el back conteste, el punto no queda colgado. El back lo
  // confirma aparte, en el efecto de abajo.
  const [toConfirm, setToConfirm] = useState<{
    conversationId: string;
    lastMessageId: string | undefined;
  } | null>(null);
  if (
    activeUnreadId &&
    (toConfirm?.conversationId !== activeUnreadId ||
      toConfirm.lastMessageId !== activeLastMessageId)
  ) {
    setToConfirm({
      conversationId: activeUnreadId,
      lastMessageId: activeLastMessageId,
    });
    setConversations((prev) =>
      markConversationReadIn(prev, activeUnreadId, activeLastMessageId),
    );
  }
  useEffect(() => {
    if (!toConfirm) return;
    const { conversationId, lastMessageId } = toConfirm;
    void markConversationReadRequest(conversationId).then((result) => {
      if (!result.ok) return;
      const key = conversationReadKey(conversationId, lastMessageId);
      setReadKeys((prev) => new Set(prev).add(key));
    });
  }, [toConfirm]);

  // Un chat restaurado tras recargar sin conversacion en el back (ni borrador
  // abierto en esta sesion) no se muestra: el back manda.
  if (
    !isLoading &&
    activePartnerId &&
    !conversations.some((c) => c.partner_id === activePartnerId) &&
    !draftPartnerIds.includes(activePartnerId)
  ) {
    setActivePartnerId(null);
  }

  /**
   * Abre la conversacion con `partnerId`. Si nunca hablaron no se crea nada
   * todavia: queda un borrador que el back convierte en conversacion con el
   * primer mensaje. `partner` evita pedir el perfil de quien se eligio de la lista.
   */
  const openConversation = useCallback(
    (partnerId: string, partner?: MessageAuthor) => {
      if (partner) {
        setPartners((prev) => ({ ...prev, [partnerId]: partner }));
        setDraftPartnerIds((prev) => [
          partnerId,
          ...prev.filter((id) => id !== partnerId),
        ]);
      }
      setActivePartnerId(partnerId);
    },
    [],
  );

  const sendMessage = useCallback(
    (
      content: string,
      attachmentIds: readonly string[] = [],
      clientId?: string,
    ): Promise<SendDmResult> => {
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
        attachmentIds,
        clientId,
      );
    },
    [activePartnerId, applyDm],
  );

  const pushToUserRoom = useCallback<UserRoomPush>(
    (event, payload, options) =>
      pushToChannel(
        userRoom.current,
        isJoined.current,
        event,
        payload,
        options,
      ),
    [],
  );

  // Con la lista cargada faltan nombre y foto de cada contacto: hasta tenerlos
  // se muestra el spinner, para no pasar por "Usuario desconocido".
  const isResolvingPartners = conversations.some(
    (conversation) => !partners[conversation.partner_id],
  );

  return {
    conversations: summaries,
    isLoading: isLoading || isResolvingPartners,
    loadError,
    reload,
    retry,
    activeSummary,
    openConversation,
    sendMessage,
    pushToUserRoom,
    isConnected,
  };
}
