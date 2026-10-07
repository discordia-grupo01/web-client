import { BLOCKS_PAGE_LIMIT, type BlockedUser } from "@discordia/client-shared";

import "server-only";

import { apiRequest, type ApiResult } from "@/lib/apiClient";

/**
 * Capa de servicios contra `messaging` (via el gateway Kong) para bloqueos.
 *
 * Endpoints reales (ver messaging/openapi.yaml):
 *   GET    /v1/blocks?limit=       -> 200 { blocks: [{ user_id, created_at }] } | 401
 *   POST   /v1/blocks { user_id }  -> 204 | 400 CANNOT_BLOCK_SELF | 401 | 404 USER_NOT_FOUND | 503 USERS_UNAVAILABLE
 *   DELETE /v1/blocks/:user_id     -> 204 | 400 CANNOT_BLOCK_SELF | 401
 * Los dos ultimos son idempotentes.
 */

export function listBlocks(
  token: string,
): Promise<ApiResult<{ blocks: BlockedUser[] }>> {
  return apiRequest(`/v1/blocks?limit=${BLOCKS_PAGE_LIMIT}`, { token });
}

export function blockUser(
  token: string,
  userId: string,
): Promise<ApiResult<null>> {
  return apiRequest("/v1/blocks", {
    method: "POST",
    token,
    data: { user_id: userId },
  });
}

export function unblockUser(
  token: string,
  userId: string,
): Promise<ApiResult<null>> {
  return apiRequest(`/v1/blocks/${encodeURIComponent(userId)}`, {
    method: "DELETE",
    token,
  });
}
