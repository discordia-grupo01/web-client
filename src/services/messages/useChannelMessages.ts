"use client";

import {
  applyMessageUpdates,
  type Channel,
  type ChangedMessagesPayload,
  isMessageErrorCode,
  MESSAGE_DELETE_FAILED,
  MESSAGE_EDIT_FAILED,
  MESSAGE_SEND_FAILED,
  type Message,
  type MessageDeletedPayload,
  type MessageUpdatedPayload,
  messageErrorFor,
  type MissedMessagesPayload,
  mergeMessages,
  removeMessages,
  SESSION_EXPIRED_MESSAGE,
  toggleReaction as toggleReactionIn,
  validateMessageContent,
} from "@discordia/client-shared";

import type { Channel as PhoenixChannel } from "phoenix";
import { useCallback, useEffect, useRef, useState } from "react";

import { fetchMessagesRequest } from "./client";
import { acquireSocket, onSocketSessionExpired } from "./socket";

export type ChatStatus =
  | "loading"
  | "ready"
  | "reconnecting"
  | "forbidden"
  | "notFound"
  | "sessionExpired"
  | "error";

/** Estados de los que no se sale solo: no se pisan con un corte de conexion. */
const TERMINAL: ReadonlySet<ChatStatus> = new Set([
  "forbidden",
  "notFound",
  "sessionExpired",
]);

export type SendMessageResult = { ok: true } | { ok: false; message: string };
export type DeleteMessageResult = SendMessageResult;
export type EditMessageResult = SendMessageResult;

interface ChannelMessages {
  status: ChatStatus;
  /** Texto para mostrar cuando `status` no es `ready`/`loading`/`reconnecting`. */
  statusMessage: string | null;
  /** `null` mientras carga el historial. De mas viejo a mas nuevo. */
  messages: Message[] | null;
  hasMore: boolean;
  isLoadingOlder: boolean;
  loadOlder: () => Promise<void>;
  /** Vuelve a intentar desde cero (tras un error). */
  retry: () => void;
  /**
   * Manda el mensaje. NO lo agrega a la lista: el servidor lo devuelve por el
   * socket (`new_message`) igual que a los demas, y de ahi llega a `messages`.
   */
  sendMessage: (content: string) => Promise<SendMessageResult>;
  /**
   * Elimina el mensaje (autor o `MANAGE_MESSAGES`, lo valida el back). Al
   * confirmarse se saca de la lista; a los demas les llega por `message_deleted`.
   */
  deleteMessage: (messageId: string) => Promise<DeleteMessageResult>;
  /**
   * Edita el mensaje (solo el autor, lo valida el back). Al confirmarse se
   * actualiza en la lista; a los demas les llega por `message_updated`.
   */
  editMessage: (
    messageId: string,
    content: string,
  ) => Promise<EditMessageResult>;
  // Reaccionar todavia no existe en el back: la UI esta maquetada y esta
  // funcion cambia solo el estado local (se pierde al recargar).
  toggleReaction: (messageId: string, emoji: string) => void;
}

/** Un canal recien creado puede no estar todavia en la cache de messaging (llega por un evento). */
const NOT_FOUND_ATTEMPTS = 3;

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
  const joinParams = useRef<{
    last_message_id?: string;
    changes_since?: string;
  }>({});
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
    let notFoundCount = 0;

    setMessages(null);
    setNextCursor(null);
    setStatus("loading");
    setStatusMessage(null);

    function fail(next: ChatStatus, message: string | null) {
      setStatus(next);
      setStatusMessage(message);
    }

    async function loadLatest(isFirstLoad: boolean, replace = false) {
      const result = await fetchMessagesRequest(channel.id);
      if (cancelled) return;
      if (!result.ok) {
        if (isFirstLoad) {
          fail(
            result.code === "FORBIDDEN"
              ? "forbidden"
              : result.code === "CHANNEL_NOT_FOUND" ||
                  result.code === "CHANNEL_NOT_TEXT"
                ? "notFound"
                : "error",
            result.message,
          );
        }
        return;
      }
      setMessages((prev) =>
        mergeMessages(replace ? [] : (prev ?? []), result.messages),
      );
      if (isFirstLoad || replace) setNextCursor(result.nextCursor);
    }

    // Trae por REST lo posterior a `afterId` hasta que el back diga que no hay mas.
    async function catchUp(afterId: string) {
      let cursor: string | null = afterId;
      while (cursor) {
        const result = await fetchMessagesRequest(channel.id, {
          after: cursor,
        });
        if (cancelled || !result.ok) return;
        setMessages((prev) => mergeMessages(prev ?? [], result.messages));
        cursor = result.nextCursor;
      }
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

      room.on("new_message", (message: Message) => {
        setMessages((prev) => mergeMessages(prev ?? [], [message]));
      });
      room.on("missed_messages", (payload: MissedMessagesPayload) => {
        setMessages((prev) => mergeMessages(prev ?? [], payload.messages));
        if (payload.next_cursor) void catchUp(payload.next_cursor);
      });
      room.on("message_updated", (message: MessageUpdatedPayload) => {
        setMessages((prev) => applyMessageUpdates(prev ?? [], [message]));
      });
      room.on("message_deleted", (payload: MessageDeletedPayload) => {
        setMessages((prev) => removeMessages(prev ?? [], [payload.id]));
      });
      // Lo editado o eliminado mientras no estabamos conectados (ver `changes_since`).
      room.on("changed_messages", (payload: ChangedMessagesPayload) => {
        setMessages((prev) =>
          removeMessages(
            applyMessageUpdates(prev ?? [], payload.messages),
            payload.deleted_ids,
          ),
        );
      });
      // El cursor del join ya no sirve: se descarta lo que hay y se recarga lo ultimo.
      room.on("resync_required", () => {
        void loadLatest(false, true);
      });

      // Corte de conexion o canal caido en el back: Phoenix re-une solo.
      room.onError(() => {
        setStatus((prev) => (TERMINAL.has(prev) ? prev : "reconnecting"));
      });

      let isFirstJoin = true;
      room
        .join()
        .receive("ok", (response?: { server_time?: string }) => {
          // Desde este instante, en el proximo join el back informa lo que cambio.
          joinParams.current.changes_since = response?.server_time;
          setStatus("ready");
          setStatusMessage(null);
          if (isFirstJoin) {
            isFirstJoin = false;
            void loadLatest(true);
          }
        })
        .receive("error", (response?: { error?: { code?: unknown } }) => {
          const code = response?.error?.code;
          // Un `join` rechazado Phoenix lo reintenta para siempre (cada pocos
          // segundos, con una llamada a `servers` cada vez). Si el rechazo es
          // deliberado del back (sin permiso, canal inexistente) se corta.
          if (!isMessageErrorCode(code)) {
            setStatus((prev) => (TERMINAL.has(prev) ? prev : "reconnecting"));
            return;
          }
          if (
            code === "CHANNEL_NOT_FOUND" &&
            ++notFoundCount < NOT_FOUND_ATTEMPTS
          ) {
            return;
          }
          room.leave();
          fail(
            code === "FORBIDDEN" ? "forbidden" : "notFound",
            messageErrorFor(code),
          );
        })
        .receive("timeout", () => {
          setStatus((prev) => (TERMINAL.has(prev) ? prev : "reconnecting"));
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

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

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
    (content: string): Promise<SendMessageResult> =>
      new Promise((resolve) => {
        const room = phoenixChannel.current;
        const invalid = validateMessageContent(content);
        if (invalid) return resolve({ ok: false, message: invalid });
        // Con el canal sin unir Phoenix encola el push y falla a los ~10 s.
        if (!room || statusRef.current !== "ready") {
          return resolve({ ok: false, message: MESSAGE_SEND_FAILED });
        }
        room
          .push("new_message", { content })
          .receive("ok", () => resolve({ ok: true }))
          .receive("error", (response?: { error?: { code?: unknown } }) =>
            resolve({
              ok: false,
              message: messageErrorFor(
                response?.error?.code,
                MESSAGE_SEND_FAILED,
              ),
            }),
          )
          .receive("timeout", () =>
            resolve({ ok: false, message: MESSAGE_SEND_FAILED }),
          );
      }),
    [],
  );

  const toggleReaction = useCallback((messageId: string, emoji: string) => {
    setMessages(
      (prev) =>
        prev?.map((message) =>
          message.id === messageId
            ? {
                ...message,
                reactions: toggleReactionIn(message.reactions, emoji),
              }
            : message,
        ) ?? null,
    );
  }, []);

  const editMessage = useCallback(
    (messageId: string, content: string): Promise<EditMessageResult> =>
      new Promise((resolve) => {
        const room = phoenixChannel.current;
        const invalid = validateMessageContent(content);
        if (invalid) return resolve({ ok: false, message: invalid });
        if (!room || statusRef.current !== "ready") {
          return resolve({ ok: false, message: MESSAGE_EDIT_FAILED });
        }
        room
          .push("edit_message", { id: messageId, content })
          .receive("ok", (message?: MessageUpdatedPayload) => {
            if (message) {
              setMessages((prev) => applyMessageUpdates(prev ?? [], [message]));
            }
            resolve({ ok: true });
          })
          .receive("error", (response?: { error?: { code?: unknown } }) => {
            // Si ya no existe, el resultado es el que se queria: que no se vea.
            if (response?.error?.code === "MESSAGE_NOT_FOUND") {
              setMessages((prev) => removeMessages(prev ?? [], [messageId]));
            }
            resolve({
              ok: false,
              message: messageErrorFor(
                response?.error?.code,
                MESSAGE_EDIT_FAILED,
              ),
            });
          })
          .receive("timeout", () =>
            resolve({ ok: false, message: MESSAGE_EDIT_FAILED }),
          );
      }),
    [],
  );

  const deleteMessage = useCallback(
    (messageId: string): Promise<DeleteMessageResult> =>
      new Promise((resolve) => {
        const room = phoenixChannel.current;
        if (!room || statusRef.current !== "ready") {
          return resolve({ ok: false, message: MESSAGE_DELETE_FAILED });
        }
        room
          .push("delete_message", { id: messageId })
          .receive("ok", () => {
            setMessages((prev) => removeMessages(prev ?? [], [messageId]));
            resolve({ ok: true });
          })
          .receive("error", (response?: { error?: { code?: unknown } }) => {
            // Si ya no existe, el resultado es el que se queria: que no se vea.
            if (response?.error?.code === "MESSAGE_NOT_FOUND") {
              setMessages((prev) => removeMessages(prev ?? [], [messageId]));
            }
            resolve({
              ok: false,
              message: messageErrorFor(
                response?.error?.code,
                MESSAGE_DELETE_FAILED,
              ),
            });
          })
          .receive("timeout", () =>
            resolve({ ok: false, message: MESSAGE_DELETE_FAILED }),
          );
      }),
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
