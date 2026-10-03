import { type MessageHistory } from "@discordia/client-shared";

import "server-only";

import { apiRequest, type ApiResult } from "@/lib/apiClient";

/**
 * Capa de servicios contra `messaging` (via el gateway Kong). Enviar y recibir
 * mensajes en vivo va por WebSocket, directo desde el navegador (ver
 * `socket.ts`); aca solo el historial y el ticket para abrir ese socket.
 *
 * Endpoints reales (ver messaging/openapi.yaml):
 *   GET  /v1/channels/:id/messages?limit=&before=|after=
 *     -> 200 { messages, next_cursor } (de mas viejo a mas nuevo)
 *      | 400 INVALID_CURSOR (cursor invalido, de otro canal, o before+after) | 401 | 403 FORBIDDEN | 404 CHANNEL_NOT_FOUND
 *   POST /v1/socket-tickets
 *     -> 201 { ticket, expires_in } | 401 | 503 TICKET_UNAVAILABLE
 */

interface ListMessagesInput {
  /** Default 50, maximo 100 (lo clampea el back). */
  limit?: number;
  /** `next_cursor` de la pagina anterior. */
  before?: string;
  /** Id del ultimo mensaje que se tiene: devuelve los posteriores. Excluyente con `before`. */
  after?: string;
}

export function listMessages(
  token: string,
  channelId: string,
  { limit, before, after }: ListMessagesInput = {},
): Promise<ApiResult<MessageHistory>> {
  const params = new URLSearchParams();
  if (limit !== undefined) params.set("limit", String(limit));
  if (before) params.set("before", before);
  if (after) params.set("after", after);
  const query = params.size > 0 ? `?${params.toString()}` : "";

  return apiRequest<MessageHistory>(
    `/v1/channels/${encodeURIComponent(channelId)}/messages${query}`,
    { token },
  );
}

export interface SocketTicket {
  ticket: string;
  /** Segundos de vida: el ticket es de un solo uso y vence a los 30 s. */
  expires_in: number;
}

/**
 * Pide un ticket de un solo uso para abrir el WebSocket. El navegador no puede
 * mandar el header Authorization en el handshake y poner el JWT en la URL lo
 * deja en los logs, asi que el JWT se queda en el servidor: aca se canjea por
 * un ticket que si es seguro exponer.
 */
export function createSocketTicket(
  token: string,
): Promise<ApiResult<SocketTicket>> {
  return apiRequest<SocketTicket>("/v1/socket-tickets", {
    method: "POST",
    token,
  });
}
