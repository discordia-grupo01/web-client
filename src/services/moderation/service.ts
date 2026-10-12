import "server-only";

import { apiRequest, type ApiResult } from "@/lib/apiClient";

/**
 * Expulsar y silenciar, contra `servers` (via Kong). Ver
 * servers/internal/handler/moderation_handler:
 *   POST   /v1/servers/:id/kicks          -> 204 | 400 | 401 | 403 | 404
 *   POST   /v1/servers/:id/mutes          -> 204 | 400 | 401 | 403 | 404
 *   DELETE /v1/servers/:id/mutes/:userId  -> 204 | 401 | 403 | 404
 *
 * Expulsar exige `KICK_MEMBERS`; silenciar, `MANAGE_MESSAGES`. Los dos exigen
 * ademas que el objetivo tenga un rol estrictamente menor (lo valida el back).
 */
export function kickMember(
  token: string,
  serverId: string,
  userId: string,
): Promise<ApiResult<void>> {
  return apiRequest<void>(`/v1/servers/${serverId}/kicks`, {
    method: "POST",
    token,
    data: { user_id: userId },
  });
}
