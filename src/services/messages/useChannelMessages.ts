"use client";

import {
  applyMessageUpdates,
  catchUpMessages,
  type Channel,
  type ChannelMessages,
  chatStatusForLoadError,
  chatStatusAfterConnectionLoss,
  type ChatStatus,
  type DeleteMessageResult,
  type EditMessageResult,
  joinMessageChannel,
  MESSAGE_DELETE_FAILED,
  MESSAGE_EDIT_FAILED,
  MESSAGE_SEND_FAILED,
  type Message,
  type MessageChannelJoinParams,
  type MessageUpdatedPayload,
  mergeMessages,
  pushMessageEvent,
  removeMessages,
  type SendMessageResult,
  SESSION_EXPIRED_MESSAGE,
  toggleMessageReaction,
  validateMessageContent,
} from "@discordia/client-shared";

import type { Channel as PhoenixChannel } from "phoenix";
import { useCallback, useEffect, useRef, useState } from "react";

import { fetchMessagesRequest } from "./client";
import { acquireSocket, onSocketSessionExpired } from "./socket";

export type {
  ChatStatus,
  DeleteMessageResult,
  EditMessageResult,
  SendMessageResult,
} from "@discordia/client-shared";

export function useChannelMessages(
  channel: Pick<Channel, "id">,
): ChannelMessages {
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [status, setStatus] = useState<ChatStatus>("loading");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const phoenixChannel = useRef<PhoenixChannel | null>(null);
  const joinParams = useRef<MessageChannelJoinParams>({});
  const statusRef = useRef<ChatStatus>("loading");
  const loadingOlderRef = useRef(false);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // El `last_message_id` de cada re-join es el mensaje mas nuevo que ya se vio. Phoenix
  // manda el mismo objeto de params en cada join, asi que alcanza con mutarlo.
  useEffect(() => {
    joinParams.current.last_message_id = messages?.[messages.length - 1]?.id;
  }, [messages]);

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
          setStatus("reconnecting");
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
      });
    }

    const stopListening = onSocketSessionExpired(() =>
      fail("sessionExpired", SESSION_EXPIRED_MESSAGE),
    );
    void start();

    return () => {
      cancelled = true;
      stopListening();
      phoenixChannel.current?.leave();
      phoenixChannel.current = null;
      release?.();
    };
  }, [channel.id, attempt]);

  // `ChannelChat` se remonta por canal (`key`), asi que el estado inicial ya es
  // el de "cargando": solo un reintento tiene que volver a el a mano.
  const retry = useCallback(() => {
    setMessages(null);
    setNextCursor(null);
    setStatus("loading");
    setStatusMessage(null);
    setAttempt((value) => value + 1);
  }, []);

  const loadOlder = useCallback(async () => {
    if (!nextCursor || loadingOlderRef.current) return;
    loadingOlderRef.current = true;
    setIsLoadingOlder(true);
    const result = await fetchMessagesRequest(channel.id, {
      before: nextCursor,
    });
    loadingOlderRef.current = false;
    setIsLoadingOlder(false);
    if (!result.ok) return;
    setMessages((prev) => mergeMessages(prev ?? [], result.messages));
    setNextCursor(result.nextCursor);
  }, [channel.id, nextCursor]);

  const sendMessage = useCallback(
    (content: string): Promise<SendMessageResult> => {
      const invalid = validateMessageContent(content);
      if (invalid) return Promise.resolve({ ok: false, message: invalid });
      return pushMessageEvent(
        phoenixChannel.current,
        statusRef.current,
        "new_message",
        { content },
        { failedMessage: MESSAGE_SEND_FAILED },
      );
    },
    [],
  );

  const toggleReaction = useCallback((messageId: string, emoji: string) => {
    setMessages(
      (prev) => prev && toggleMessageReaction(prev, messageId, emoji),
    );
  }, []);

  const editMessage = useCallback(
    (messageId: string, content: string): Promise<EditMessageResult> => {
      const invalid = validateMessageContent(content);
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
    retry,
    sendMessage,
    toggleReaction,
    editMessage,
    deleteMessage,
  };
}
