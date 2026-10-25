"use client";

import {
  type AccessRevokedReason,
  applyMessageUpdates,
  catchUpMessages,
  type Channel,
  type ChannelMessages,
  chatStatusForLoadError,
  chatStatusAfterConnectionLoss,
  type ChatStatus,
  type DeleteMessageResult,
  type EditMessageResult,
  type FocusedMessage,
  joinMessageChannel,
  JUMP_TO_MESSAGE_FAILED,
  MESSAGE_DELETE_FAILED,
  MESSAGE_EDIT_FAILED,
  MESSAGE_JUMP_WINDOW,
  MESSAGE_SEND_FAILED,
  type Message,
  type MessageActionResult,
  type MessageChannelJoinParams,
  type MessageUpdatedPayload,
  mergeMessages,
  pushMessageEvent,
  pushReaction,
  type ReactionResult,
  reactionEventFor,
  removeMessages,
  type SendMessageResult,
  SESSION_EXPIRED_MESSAGE,
  setMessageReaction,
  validateMessageContent,
  withAttachmentIds,
  withClientId,
} from "@discordia/client-shared";

import type { Channel as PhoenixChannel } from "phoenix";
import { useCallback, useEffect, useRef, useState } from "react";

import { fetchMessagesRequest } from "@/services/messages/client";
import {
  acquireSocket,
  onSocketGaveUp,
  onSocketSessionExpired,
} from "@/services/messages/socket";

export type {
  ChatStatus,
  DeleteMessageResult,
  EditMessageResult,
  SendMessageResult,
} from "@discordia/client-shared";

interface UseChannelMessagesOptions {
  onAccessRevoked?: (reason: AccessRevokedReason) => void;
}

export function useChannelMessages(
  channel: Pick<Channel, "id">,
  currentUserId: string | null = null,
  { onAccessRevoked }: UseChannelMessagesOptions = {},
): ChannelMessages {
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [status, setStatus] = useState<ChatStatus>("loading");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [newerCursor, setNewerCursor] = useState<string | null>(null);
  const [isLoadingNewer, setIsLoadingNewer] = useState(false);
  const [focusedMessage, setFocusedMessage] = useState<FocusedMessage | null>(
    null,
  );
  const [attempt, setAttempt] = useState(0);

  const phoenixChannel = useRef<PhoenixChannel | null>(null);
  const joinParams = useRef<MessageChannelJoinParams>({});
  const statusRef = useRef<ChatStatus>("loading");
  const loadingOlderRef = useRef(false);
  const loadingNewerRef = useRef(false);
  const newerCursorRef = useRef<string | null>(null);
  // Sube con cada salto (a un mensaje o al presente): una respuesta pedida
  // para una vista anterior ya no se aplica.
  const viewRef = useRef(0);
  const focusNonce = useRef(0);
  const messagesRef = useRef<Message[] | null>(null);
  const currentUserIdRef = useRef(currentUserId);
  const onAccessRevokedRef = useRef(onAccessRevoked);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  useEffect(() => {
    onAccessRevokedRef.current = onAccessRevoked;
  }, [onAccessRevoked]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const setNewer = useCallback((cursor: string | null) => {
    newerCursorRef.current = cursor;
    setNewerCursor(cursor);
  }, []);

  // El `last_message_id` de cada re-join es el mensaje mas nuevo que ya se vio. Phoenix
  // manda el mismo objeto de params en cada join, asi que alcanza con mutarlo.
  // Mientras se ve el pasado queda el del presente.
  useEffect(() => {
    if (newerCursor !== null) return;
    joinParams.current.last_message_id = messages?.[messages.length - 1]?.id;
  }, [messages, newerCursor]);

  useEffect(() => {
    let cancelled = false;
    let release: (() => void) | null = null;

    function fail(next: ChatStatus, message: string | null) {
      setStatus(next);
      setStatusMessage(message);
    }

    function updateMessages(update: (current: Message[]) => Message[]) {
      setMessages((prev) => update(prev ?? []));
    }

    async function loadLatest(isFirstLoad: boolean, replace = false) {
      const result = await fetchMessagesRequest(channel.id);
      if (cancelled) return;
      if (!result.ok) {
        if (isFirstLoad) {
          fail(chatStatusForLoadError(result.code), result.message);
        }
        return;
      }
      setMessages((prev) =>
        mergeMessages(replace ? [] : (prev ?? []), result.messages),
      );
      if (isFirstLoad || replace) setNextCursor(result.nextCursor);
      if (replace) setNewer(null);
    }

    async function start() {
      const acquired = await acquireSocket();
      if (cancelled) {
        if (acquired.ok) acquired.release();
        return;
      }
      if (!acquired.ok) {
        if (acquired.sessionExpired) {
          fail("sessionExpired", SESSION_EXPIRED_MESSAGE);
        } else {
          setStatus("offline");
        }
        return;
      }
      release = acquired.release;

      const room = acquired.socket.channel(
        `channel:${channel.id}`,
        joinParams.current,
      );
      phoenixChannel.current = room;

      joinMessageChannel(room, joinParams.current, {
        updateMessages,
        catchUp: (afterCursor) =>
          void catchUpMessages(
            (cursor) => fetchMessagesRequest(channel.id, { after: cursor }),
            afterCursor,
            (page) => updateMessages((current) => mergeMessages(current, page)),
            () => cancelled,
          ),
        resync: () => void loadLatest(false, true),
        connectionLost: () =>
          setStatus((prev) => chatStatusAfterConnectionLoss(prev)),
        joined: (isFirstJoin) => {
          setStatus("ready");
          setStatusMessage(null);
          if (isFirstJoin) void loadLatest(true);
        },
        rejected: fail,
        accessRevoked: (next, message, reason) => {
          fail(next, message);
          onAccessRevokedRef.current?.(reason);
        },
        get currentUserId() {
          return currentUserIdRef.current;
        },
        isViewingPast: () => newerCursorRef.current !== null,
      });
    }

    const stopSessionListener = onSocketSessionExpired(() =>
      fail("sessionExpired", SESSION_EXPIRED_MESSAGE),
    );
    const stopGaveUpListener = onSocketGaveUp(() =>
      setStatus((prev) =>
        prev === "ready" || prev === "reconnecting" || prev === "loading"
          ? "offline"
          : prev,
      ),
    );
    void start();

    return () => {
      cancelled = true;
      stopSessionListener();
      stopGaveUpListener();
      phoenixChannel.current?.leave();
      phoenixChannel.current = null;
      release?.();
    };
  }, [channel.id, attempt, setNewer]);

  // `ChannelChat` se remonta por canal (`key`), asi que el estado inicial ya es
  // el de "cargando": solo un reintento tiene que volver a el a mano.
  const retry = useCallback(() => {
    viewRef.current += 1;
    setNewer(null);
    setFocusedMessage(null);
    setMessages(null);
    setNextCursor(null);
    setStatus("loading");
    setStatusMessage(null);
    setAttempt((value) => value + 1);
  }, [setNewer]);

  const loadOlder = useCallback(async () => {
    if (!nextCursor || loadingOlderRef.current) return;
    const view = viewRef.current;
    loadingOlderRef.current = true;
    setIsLoadingOlder(true);
    const result = await fetchMessagesRequest(channel.id, {
      before: nextCursor,
    });
    loadingOlderRef.current = false;
    setIsLoadingOlder(false);
    if (!result.ok || viewRef.current !== view) return;
    setMessages((prev) => mergeMessages(prev ?? [], result.messages));
    setNextCursor(result.nextCursor);
  }, [channel.id, nextCursor]);

  // Lo que haya llegado mientras se pedia la ultima pagina se perdio (el
  // socket no agrega nada mientras se ve el pasado): se trae por REST.
  const catchUpFrom = useCallback(
    (afterId: string, view: number) =>
      void catchUpMessages(
        (cursor) => fetchMessagesRequest(channel.id, { after: cursor }),
        afterId,
        (page) => setMessages((prev) => mergeMessages(prev ?? [], page)),
        () => viewRef.current !== view,
      ),
    [channel.id],
  );

  const jumpToMessage = useCallback(
    async (messageId: string): Promise<MessageActionResult> => {
      const focus = () =>
        setFocusedMessage({ id: messageId, nonce: ++focusNonce.current });
      if (messagesRef.current?.some((message) => message.id === messageId)) {
        focus();
        return { ok: true };
      }

      const view = ++viewRef.current;
      const result = await fetchMessagesRequest(channel.id, {
        around: messageId,
        limit: MESSAGE_JUMP_WINDOW,
      });
      if (viewRef.current !== view) return { ok: true };
      if (!result.ok) {
        return {
          ok: false,
          message:
            result.code === "MESSAGE_NOT_FOUND"
              ? result.message
              : JUMP_TO_MESSAGE_FAILED,
        };
      }

      const newer = result.newerCursor ?? null;
      setNewer(newer);
      setMessages(result.messages);
      setNextCursor(result.nextCursor);
      focus();
      const last = result.messages[result.messages.length - 1]?.id;
      if (newer === null && last) catchUpFrom(last, view);
      return { ok: true };
    },
    [channel.id, setNewer, catchUpFrom],
  );

  const loadNewer = useCallback(async () => {
    const cursor = newerCursorRef.current;
    if (!cursor || loadingNewerRef.current) return;
    const view = viewRef.current;
    loadingNewerRef.current = true;
    setIsLoadingNewer(true);
    const result = await fetchMessagesRequest(channel.id, { after: cursor });
    loadingNewerRef.current = false;
    setIsLoadingNewer(false);
    if (!result.ok || viewRef.current !== view) return;
    setMessages((prev) => mergeMessages(prev ?? [], result.messages));
    setNewer(result.nextCursor);
    if (result.nextCursor === null) {
      catchUpFrom(
        result.messages[result.messages.length - 1]?.id ?? cursor,
        view,
      );
    }
  }, [channel.id, setNewer, catchUpFrom]);

  // Se vacia la lista en vez de reemplazarla al final: lo que llegue por el
  // socket mientras tanto se agrega y queda junto con lo ultimo del REST.
  const jumpToPresent = useCallback(() => {
    if (newerCursorRef.current === null) return;
    const view = ++viewRef.current;
    setNewer(null);
    setFocusedMessage(null);
    setMessages(null);
    setNextCursor(null);
    void fetchMessagesRequest(channel.id).then((result) => {
      if (viewRef.current !== view) return;
      if (!result.ok) {
        retry();
        return;
      }
      setMessages((prev) => mergeMessages(prev ?? [], result.messages));
      setNextCursor(result.nextCursor);
    });
  }, [channel.id, setNewer, retry]);

  const sendMessage = useCallback(
    (
      content: string,
      attachmentIds: readonly string[] = [],
      clientId?: string,
    ): Promise<SendMessageResult> => {
      const invalid = validateMessageContent(content, attachmentIds.length > 0);
      if (invalid) return Promise.resolve({ ok: false, message: invalid });
      return pushMessageEvent(
        phoenixChannel.current,
        statusRef.current,
        "new_message",
        withClientId(withAttachmentIds({ content }, attachmentIds), clientId),
        { failedMessage: MESSAGE_SEND_FAILED },
      );
    },
    [],
  );

  const toggleReaction = useCallback(
    (messageId: string, emoji: string): Promise<ReactionResult> => {
      const message = messagesRef.current?.find((m) => m.id === messageId);
      return pushReaction(
        phoenixChannel.current,
        statusRef.current,
        reactionEventFor(message ?? {}, emoji),
        messageId,
        emoji,
        (reaction) =>
          setMessages(
            (prev) => prev && setMessageReaction(prev, messageId, reaction),
          ),
      );
    },
    [],
  );

  const editMessage = useCallback(
    (messageId: string, content: string): Promise<EditMessageResult> => {
      const hasAttachments = Boolean(
        messagesRef.current?.find((m) => m.id === messageId)?.attachments
          ?.length,
      );
      const invalid = validateMessageContent(content, hasAttachments);
      if (invalid) return Promise.resolve({ ok: false, message: invalid });
      return pushMessageEvent(
        phoenixChannel.current,
        statusRef.current,
        "edit_message",
        { id: messageId, content },
        {
          failedMessage: MESSAGE_EDIT_FAILED,
          onOk: (message) => {
            if (message) {
              setMessages((prev) =>
                applyMessageUpdates(prev ?? [], [
                  message as MessageUpdatedPayload,
                ]),
              );
            }
          },
          onMessageNotFound: () =>
            setMessages((prev) => removeMessages(prev ?? [], [messageId])),
        },
      );
    },
    [],
  );

  const deleteMessage = useCallback(
    (messageId: string): Promise<DeleteMessageResult> =>
      pushMessageEvent(
        phoenixChannel.current,
        statusRef.current,
        "delete_message",
        { id: messageId },
        {
          failedMessage: MESSAGE_DELETE_FAILED,
          onOk: () =>
            setMessages((prev) => removeMessages(prev ?? [], [messageId])),
          onMessageNotFound: () =>
            setMessages((prev) => removeMessages(prev ?? [], [messageId])),
        },
      ),
    [],
  );

  return {
    status,
    statusMessage,
    messages,
    hasMore: nextCursor !== null,
    isLoadingOlder,
    loadOlder,
    hasNewer: newerCursor !== null,
    isLoadingNewer,
    loadNewer,
    jumpToMessage,
    jumpToPresent,
    focusedMessage,
    retry,
    sendMessage,
    toggleReaction,
    editMessage,
    deleteMessage,
  };
}
