import type { PresenceListResponse } from "@discordia/client-shared";

import "server-only";

import { apiRequest, type ApiResult } from "@/lib/apiClient";

/**
 * Capa de servicios contra `messaging` (via el gateway Kong) para el estado de
 * actividad. Los cambios en vivo llegan por las salas `user:<id>` y
 * `presence:<server>` (ver `services/presence/`); aca solo la foto por REST.
 *
 *   GET /v1/presence?user_ids=a,b -> 200 { presences } | 400 INVALID_PAYLOAD | 401 | 503 PRESENCE_UNAVAILABLE
 */
export function getPresence(
  token: string,
  userIds: readonly string[],
): Promise<ApiResult<PresenceListResponse>> {
  const ids = userIds.map(encodeURIComponent).join(",");
  return apiRequest<PresenceListResponse>(`/v1/presence?user_ids=${ids}`, {
    token,
  });
}
