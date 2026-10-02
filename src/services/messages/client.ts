import {
  type ListMessagesResult,
  MESSAGES_LOAD_FAILED,
} from "@discordia/client-shared";

import { api } from "@/lib/browserApiClient";

/**
 * Llamadas del navegador hacia el BFF de mensajes (`/api/*`, mismo origen).
 */

export type SocketTicketResult =
  { ok: true; ticket: string } | { ok: false; sessionExpired: boolean };

/**
 * Pide un ticket de un solo uso (vence a los 30 s) para abrir el WebSocket
 * (ver `app/api/realtime/ticket/route.ts`). `sessionExpired` distingue una
 * sesion muerta (no tiene sentido reintentar) de un fallo transitorio de red o
 * del servicio (se puede reintentar).
 */
export async function fetchSocketTicketRequest(): Promise<SocketTicketResult> {
  try {
    const { data, status } = await api.post<{ ticket?: string }>(
      "/realtime/ticket",
    );
    if (status === 200 && typeof data?.ticket === "string") {
      return { ok: true, ticket: data.ticket };
    }
    return { ok: false, sessionExpired: status === 401 };
  } catch {
    return { ok: false, sessionExpired: false };
  }
}

/**
 * Una pagina del historial del canal (mas nuevos primero). Para la pagina
 * anterior se pasa el `nextCursor` de la respuesta como `before`.
 */
export async function fetchMessagesRequest(
  channelId: string,
  options: { limit?: number; before?: string } = {},
): Promise<ListMessagesResult> {
  try {
    const { data } = await api.get<ListMessagesResult>(
      `/channels/${encodeURIComponent(channelId)}/messages`,
      { params: options },
    );
    if (typeof data?.ok !== "boolean") {
      return { ok: false, message: MESSAGES_LOAD_FAILED };
    }
    return data;
  } catch {
    return { ok: false, message: MESSAGES_LOAD_FAILED };
  }
}
