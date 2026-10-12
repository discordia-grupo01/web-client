import type { BannedWordsResponse } from "@discordia/client-shared";

import "server-only";

import { apiRequest, type ApiResult } from "@/lib/apiClient";

/**
 * Palabras prohibidas de un servidor, contra `servers` (via Kong). Los dos
 * endpoints exigen `MANAGE_MESSAGES` (el owner y los admins lo tienen
 * implicito):
 *   GET /v1/servers/:id/banned-words -> 200 { words } | 401 | 403 | 404
 *   PUT /v1/servers/:id/banned-words -> 200 { words } | 400 | 401 | 403 | 404
 *
 * El PUT manda la lista ENTERA y reemplaza la anterior; vacia saca el filtro.
 */
export function listBannedWords(
  token: string,
  serverId: string,
): Promise<ApiResult<BannedWordsResponse>> {
  return apiRequest<BannedWordsResponse>(
    `/v1/servers/${serverId}/banned-words`,
    { method: "GET", token },
  );
}

export function saveBannedWords(
  token: string,
  serverId: string,
  words: string[],
): Promise<ApiResult<BannedWordsResponse>> {
  return apiRequest<BannedWordsResponse>(
    `/v1/servers/${serverId}/banned-words`,
    { method: "PUT", token, data: { words } },
  );
}
