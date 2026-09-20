import { type Channel } from "@discordia/client-shared";

import "server-only";

import { apiRequest, type ApiResult } from "@/lib/api-client";

/**
 * Capa de servicios contra el servicio `servers` (via el gateway Kong) para
 * canales. Ver `services/servers/service.ts` para el resto de los endpoints
 * de `servers` y las notas generales sobre el back.
 *
 * Endpoints reales (ver servers/internal/handler):
 *   POST   /v1/servers/:id/channels               -> 201 Channel | 400 | 401 | 403 | 404
 *   PATCH  /v1/channels/:id                       -> 200 Channel | 400 | 401 | 403 | 404
 *   DELETE /v1/channels/:id                       -> 204 | 401 | 403 | 404
 *   PATCH  /v1/channels/:id/category               -> 200 Channel | 400 | 401 | 403 | 404
 *   PATCH  /v1/servers/:id/channels/reorder        -> 200 | 400 | 401 | 403 | 404
 */

interface CreateChannelInput {
  name: string;
  kind: "text" | "voice";
  categoryId?: string;
}

export function createChannel(
  token: string,
  serverId: string,
  input: CreateChannelInput,
): Promise<ApiResult<Channel>> {
  return apiRequest<Channel>(`/v1/servers/${serverId}/channels`, {
    method: "POST",
    token,
    data: {
      name: input.name,
      kind: input.kind,
      ...(input.categoryId ? { category_id: input.categoryId } : {}),
    },
  });
}

interface UpdateChannelInput {
  name: string;
}

export function updateChannel(
  token: string,
  channelId: string,
  input: UpdateChannelInput,
): Promise<ApiResult<Channel>> {
  return apiRequest<Channel>(`/v1/channels/${channelId}`, {
    method: "PATCH",
    token,
    data: input,
  });
}

export function deleteChannel(
  token: string,
  channelId: string,
): Promise<ApiResult<void>> {
  return apiRequest<void>(`/v1/channels/${channelId}`, {
    method: "DELETE",
    token,
  });
}

/** `categoryId: null` mueve el canal a "sin categoria". */
export function moveChannelToCategory(
  token: string,
  channelId: string,
  categoryId: string | null,
): Promise<ApiResult<Channel>> {
  return apiRequest<Channel>(`/v1/channels/${channelId}/category`, {
    method: "PATCH",
    token,
    data: { category_id: categoryId },
  });
}

/**
 * `categoryId: null` reordena el balde "sin categoria" de ese servidor.
 * `channelIds` tiene que ser exactamente el set de canales que el back tiene
 * hoy en esa categoria (mismo largo, mismos ids): el back lo valida y
 * devuelve 400 `reorder_invalid` si no matchea.
 */
export function reorderChannels(
  token: string,
  serverId: string,
  categoryId: string | null,
  channelIds: string[],
): Promise<ApiResult<void>> {
  return apiRequest<void>(`/v1/servers/${serverId}/channels/reorder`, {
    method: "PATCH",
    token,
    data: { category_id: categoryId, channel_ids: channelIds },
  });
}
