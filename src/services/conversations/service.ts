import type { DirectConversation } from "@discordia/client-shared";

import "server-only";

import { apiRequest, type ApiResult } from "@/lib/apiClient";

/**
 * Capa de servicios contra `messaging` (via el gateway Kong) para mensajes
 * directos. Enviar un DM va por WebSocket (`send_dm`, ver
 * `services/conversations/useDirectMessages.ts`); aca solo REST.
 *
 * Endpoints reales (ver messaging/openapi.yaml):
 *   GET  /v1/conversations         -> 200 { conversations } | 401
 *   POST /v1/conversations/:id/read -> 204 | 401 | 404 CHANNEL_NOT_FOUND
 */

export function listConversations(
  token: string,
): Promise<ApiResult<{ conversations: DirectConversation[] }>> {
  return apiRequest("/v1/conversations", { token });
}

export function markConversationRead(
  token: string,
  conversationId: string,
): Promise<ApiResult<null>> {
  return apiRequest(
    `/v1/conversations/${encodeURIComponent(conversationId)}/read`,
    { method: "POST", token },
  );
}
