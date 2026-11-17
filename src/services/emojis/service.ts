import {
  NETWORK_ERROR_MESSAGE,
  networkFailure,
  type ApiResult,
  type ServerEmoji,
  type ServerEmojiPage,
  toApiResult,
} from "@discordia/client-shared";

import "server-only";

import { apiRequest } from "@/lib/apiClient";
import { env } from "@/lib/env";

/**
 * Emojis personalizados de un servidor, contra `servers` (via Kong):
 *   GET    /v1/servers/:id/emojis           -> 200 { emojis, max_emojis } | 401 | 403 | 404
 *   POST   /v1/servers/:id/emojis           -> 201 emoji | 400 | 401 | 403 | 404 | 409
 *   DELETE /v1/servers/:id/emojis/:emojiId  -> 204 | 401 | 403 | 404
 *
 * Listar lo puede hacer cualquier miembro; subir y borrar exigen
 * `MANAGE_SERVER` (el owner y los admins lo tienen implicito).
 */

export function listServerEmojis(
  token: string,
  serverId: string,
): Promise<ApiResult<ServerEmojiPage>> {
  return apiRequest<ServerEmojiPage>(`/v1/servers/${serverId}/emojis`, {
    method: "GET",
    token,
  });
}

export async function uploadServerEmoji(
  token: string,
  serverId: string,
  formData: FormData,
): Promise<ApiResult<ServerEmoji>> {
  try {
    const response = await fetch(
      `${env.apiUrl}/v1/servers/${serverId}/emojis`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      },
    );
    const body = await response.json().catch(() => undefined);
    return toApiResult<ServerEmoji>(response.status, body);
  } catch {
    return networkFailure(NETWORK_ERROR_MESSAGE);
  }
}

export function deleteServerEmoji(
  token: string,
  serverId: string,
  emojiId: string,
): Promise<ApiResult<void>> {
  return apiRequest<void>(`/v1/servers/${serverId}/emojis/${emojiId}`, {
    method: "DELETE",
    token,
  });
}
