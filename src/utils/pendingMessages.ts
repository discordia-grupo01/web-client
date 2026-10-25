import {
  parsePending,
  type PendingMessage,
  serializePending,
  withChatPending,
} from "@discordia/client-shared";

import { PENDING_MESSAGES_STORAGE_KEY } from "@/lib/constants";

const keyFor = (userId: string) => `${PENDING_MESSAGES_STORAGE_KEY}:${userId}`;

function readAll(userId: string) {
  try {
    return parsePending(localStorage.getItem(keyFor(userId)), Date.now());
  } catch {
    return {};
  }
}

/** Los mensajes sin enviar de un chat, ya sin los de mas de 2 h. */
export function loadPendingMessages(
  userId: string,
  chatKey: string,
): PendingMessage[] {
  return readAll(userId)[chatKey] ?? [];
}

export function savePendingMessages(
  userId: string,
  chatKey: string,
  entries: readonly PendingMessage[],
): void {
  try {
    localStorage.setItem(
      keyFor(userId),
      serializePending(withChatPending(readAll(userId), chatKey, entries)),
    );
  } catch {
    // Sin storage (modo privado, bloqueado): solo se pierde la recuperacion tras recargar.
  }
}

export function clearPendingMessages(userId: string): void {
  try {
    localStorage.removeItem(keyFor(userId));
  } catch {
    // Nada que limpiar.
  }
}
