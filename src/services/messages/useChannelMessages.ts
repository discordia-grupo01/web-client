"use client";

import {
  type Channel,
  deleteMessage as deleteMessageIn,
  editMessageContent,
  isMessageErrorCode,
  MESSAGE_SEND_FAILED,
  type Message,
  messageErrorFor,
  type MissedMessagesPayload,
  mergeMessages,
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
  // Editar, borrar y reaccionar: todavia no existen en el back. La UI esta
  // maquetada y estas tres funciones cambian solo el estado local (se pierden
  // al recargar). Cuando el back las tenga, se reemplazan por llamadas.
  toggleReaction: (messageId: string, emoji: string) => void;
  editMessage: (messageId: string, content: string) => void;
  deleteMessage: (messageId: string) => void;
}

/** Tras un corte el back devuelve como mucho 100 mensajes; si vienen 100, puede faltar mas. */
const MISSED_MESSAGES_CAP = 100;
/**
 * El `since` se corre un poco hacia atras: el back compara con `>` estricto y
 * en milisegundos, asi que un mensaje en el mismo milisegundo exacto se
 * perderia. Lo que se re-envie de mas se descarta por `id`.
 */
const SINCE_OVERLAP_MS = 2_000;
/** Un canal recien creado puede no estar todavia en la cache de messaging (llega por un evento). */
const NOT_FOUND_ATTEMPTS = 3;

function sinceOf(newest: Message | undefined): string | undefined {
  if (!newest) return undefined;
  return new Date(
    Date.parse(newest.inserted_at) - SINCE_OVERLAP_MS,
  ).toISOString();
}

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
  const joinParams = useRef<{ since?: string }>({});
  const statusRef = useRef<ChatStatus>("loading");
  const loadingOlderRef = useRef(false);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // El `since` de cada re-join es el mensaje mas nuevo que ya se vio. Phoenix
  // manda el mismo objeto de params en cada join, asi que alcanza con mutarlo.
  useEffect(() => {
    joinParams.current.since = sinceOf(messages?.[messages.length - 1]);
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

    async function loadLatest(isFirstLoad: boolean) {
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
      setMessages((prev) => mergeMessages(prev ?? [], result.messages));
      if (isFirstLoad) setNextCursor(result.nextCursor);
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
        // Si se llego al tope pudo haber mas: se vuelve a pedir lo ultimo.
        if (payload.messages.length >= MISSED_MESSAGES_CAP) {
          void loadLatest(false);
        }
      });

      // Corte de conexion o canal caido en el back: Phoenix re-une solo.
      room.onError(() => {
        setStatus((prev) => (TERMINAL.has(prev) ? prev : "reconnecting"));
      });

      let isFirstJoin = true;
      room
        .join()
        .receive("ok", () => {
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

  const editMessage = useCallback((messageId: string, content: string) => {
    if (validateMessageContent(content)) return;
    setMessages(
      (prev) =>
        prev?.map((message) =>
          message.id === messageId
            ? editMessageContent(message, content.trim())
            : message,
        ) ?? null,
    );
  }, []);

  const deleteMessage = useCallback((messageId: string) => {
    setMessages(
      (prev) =>
        prev?.map((message) =>
          message.id === messageId ? deleteMessageIn(message) : message,
        ) ?? null,
    );
  }, []);

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
