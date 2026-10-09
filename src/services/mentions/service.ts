import {
  type MentionsResponse,
  UNREAD_MENTIONS_LIMIT,
} from "@discordia/client-shared";

import "server-only";

import { apiRequest, type ApiResult } from "@/lib/apiClient";

/**
 * Capa de servicios contra `messaging` (via el gateway Kong) para las menciones.
 * La notificacion en vivo llega por el evento `mention` de la sala personal
 * (ver `services/mentions/useMentions.ts`); aca solo REST.
 *
 * Endpoints reales (ver messaging/openapi.yaml):
 *   GET  /v1/mentions?limit                    -> 200 { mentions } | 401 | 503 MENTIONS_UNAVAILABLE
 *   POST /v1/channels/:id/mentions/read        -> 204 | 401 | 404 CHANNEL_NOT_FOUND | 400 CHANNEL_NOT_TEXT
 */

export function listUnreadMentions(
  token: string,
): Promise<ApiResult<MentionsResponse>> {
  return apiRequest<MentionsResponse>(
    `/v1/mentions?limit=${UNREAD_MENTIONS_LIMIT}`,
    { token },
  );
}

export function markChannelMentionsRead(
  token: string,
  channelId: string,
): Promise<ApiResult<null>> {
  return apiRequest(
    `/v1/channels/${encodeURIComponent(channelId)}/mentions/read`,
    { method: "POST", token },
  );
}
