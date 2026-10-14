"use client";

import {
  addFailed,
  type FailedMessage,
  type Message,
  validateMessageContent,
  withFailedMessages,
} from "@discordia/client-shared";

import { useCallback, useEffect, useRef, useState } from "react";

import type { SendMessageResult } from "./useChannelMessages";

interface UseFailedMessagesOptions {
  /** El chat abierto (canal o conversacion): al cambiarlo se olvidan los fallidos. */
  chatKey: string;
  /** Id que llevan los mensajes de este chat (el del canal o el de la conversacion). */
  channelId: string;
  currentUserId: string | null;
  /** El envio real (`sendMessage` del canal, o `send_dm` en un DM). */
  send: (
    content: string,
    attachmentIds?: readonly string[],
  ) => Promise<SendMessageResult>;
  /** El ultimo mensaje del chat ahora mismo; ahi se ancla un fallido. */
  getLastMessageId: () => string | null;
}

/**
 * Envio de solo texto sin esperar: el texto sale del cuadro al instante y, si
 * el envio sale bien, el mensaje llega por el socket como siempre. Si falla,
 * queda marcado en el chat donde se envio (el back no guarda nada de un fallo,
 * vive solo en pantalla y desaparece al cambiar de chat).
 *
 * Con adjuntos se envia como siempre: el cuadro espera la respuesta.
 */
export function useFailedMessages({
  chatKey,
  channelId,
  currentUserId,
  send,
  getLastMessageId,
}: UseFailedMessagesOptions) {
  const [state, setState] = useState<{
    chatKey: string;
    failed: FailedMessage[];
  }>({ chatKey, failed: [] });
  if (state.chatKey !== chatKey) setState({ chatKey, failed: [] });

  const sendRef = useRef(send);
  const lastMessageIdRef = useRef(getLastMessageId);
  useEffect(() => {
    sendRef.current = send;
    lastMessageIdRef.current = getLastMessageId;
  });

  const onSend = useCallback(
    (content: string, attachmentIds: readonly string[] = []) => {
      if (attachmentIds.length > 0 || !currentUserId) {
        return sendRef.current(content, attachmentIds);
      }
      const invalid = validateMessageContent(content);
      if (invalid) {
        return Promise.resolve<SendMessageResult>({
          ok: false,
          message: invalid,
        });
      }
      const entry = {
        tempId: crypto.randomUUID(),
        content,
        afterMessageId: lastMessageIdRef.current(),
      };
      void sendRef.current(content).then((result) => {
        if (result.ok) return;
        // Si ya se cambio de chat, el fallo se pierde con el chat.
        setState((prev) =>
          prev.chatKey === chatKey
            ? {
                chatKey,
                failed: addFailed(prev.failed, {
                  ...entry,
                  error: result.message,
                }),
              }
            : prev,
        );
      });
      return undefined;
    },
    [chatKey, currentUserId],
  );

  const withFailed = useCallback(
    (messages: Message[]): Message[] =>
      currentUserId && state.chatKey === chatKey
        ? withFailedMessages(messages, state.failed, currentUserId, channelId)
        : messages,
    [state, chatKey, channelId, currentUserId],
  );

  return { onSend, withFailed };
}
