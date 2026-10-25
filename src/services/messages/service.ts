import {
  type ListMessagesOptions,
  type MessageHistory,
  type MessageSearchQuery,
  type MessageSearchResponse,
  messageSearchParams,
} from "@discordia/client-shared";

import "server-only";

import { apiRequest, type ApiResult } from "@/lib/apiClient";

/**
 * Capa de servicios contra `messaging` (via el gateway Kong). Enviar y recibir
 * mensajes en vivo va por WebSocket, directo desde el navegador (ver
 * `socket.ts`); aca solo el historial y el ticket para abrir ese socket.
 *
 * Endpoints reales (ver messaging/openapi.yaml):
 *   GET  /v1/channels/:id/messages?limit=&before=|after=|around=
 *     -> 200 { messages, next_cursor, newer_cursor? } (de mas viejo a mas nuevo; newer_cursor solo con around)
 *      | 400 INVALID_CURSOR (cursor invalido, de otro canal, o mas de un cursor) | 401 | 403 FORBIDDEN
 *      | 404 CHANNEL_NOT_FOUND | MESSAGE_NOT_FOUND (el de around no existe o se borro)
 *   GET  /v1/servers/:id/messages/search?q=&author_id=&limit=&before=
 *     -> 200 { messages, next_cursor, total, total_capped } (de mas nuevo a mas viejo)
 *      | 400 INVALID_SEARCH_QUERY | INVALID_CURSOR | 401 | 403 NOT_SERVER_MEMBER | 429 (gateway) | 503 SEARCH_UNAVAILABLE
 *   POST /v1/socket-tickets
 *     -> 201 { ticket, expires_in } | 401 | 503 TICKET_UNAVAILABLE
 */

export function listMessages(
  token: string,
  channelId: string,
  { limit, before, after, around }: ListMessagesOptions = {},
): Promise<ApiResult<MessageHistory>> {
  const params = new URLSearchParams();
  if (limit !== undefined) params.set("limit", String(limit));
  if (before) params.set("before", before);
  if (after) params.set("after", after);
  if (around) params.set("around", around);
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

/** Busca mensajes en los canales del servidor que el usuario puede ver. */
export function searchMessages(
  token: string,
  serverId: string,
  query: MessageSearchQuery,
  before: string | null = null,
): Promise<ApiResult<MessageSearchResponse>> {
  const params = new URLSearchParams(messageSearchParams(query, before));
  return apiRequest<MessageSearchResponse>(
    `/v1/servers/${encodeURIComponent(serverId)}/messages/search?${params.toString()}`,
    { token },
  );
}
