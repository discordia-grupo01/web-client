import type { ApiResult, CustomEmoji } from "@discordia/client-shared";

import "server-only";

import { apiRequest } from "@/lib/apiClient";

export interface CustomEmojisResponse {
  emojis: CustomEmoji[];
}

/**
 * Datos de los emojis que aparecen escritos en mensajes y reacciones, contra
 * `messaging` (via Kong):
 *   GET /v1/custom-emojis?ids=a,b,c -> 200 { emojis } | 400 | 401 | 503
 */
export function listCustomEmojis(
  token: string,
  ids: readonly string[],
): Promise<ApiResult<CustomEmojisResponse>> {
  return apiRequest<CustomEmojisResponse>(
    `/v1/custom-emojis?ids=${encodeURIComponent(ids.join(","))}`,
    { method: "GET", token },
  );
}
