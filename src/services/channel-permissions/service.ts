import type {
  ChannelOverride,
  ChannelOverridePermission,
} from "@discordia/client-shared";

import "server-only";

import { apiRequest, type ApiResult } from "@/lib/apiClient";

/**
 * Capa de servicios contra el servicio `servers` (via el gateway Kong) para
 * las excepciones de permisos de un rol en un canal. Ver
 * `services/servers/service.ts` para las notas generales sobre el back.
 *
 * Endpoints reales (ver servers/internal/handler/channelperm_handler):
 *   GET    /v1/channels/:id/permissions                 -> 200 [ChannelOverride] | 401 | 403 | 404
 *   PUT    /v1/channels/:id/permissions/roles/:roleId   -> 200 ChannelOverride | 204 | 400 | 401 | 403 | 404
 *   DELETE /v1/channels/:id/permissions/roles/:roleId   -> 204 | 400 | 401 | 403 | 404
 *   GET    /v1/channels/:id/members/:userId/permissions -> 200 { permissions } | 401 | 403 | 404
 *
 * Listar y escribir exige MANAGE_ROLES. Los permisos efectivos solo exigen
 * ser miembro del servidor.
 */

export function listChannelOverrides(
  token: string,
  channelId: string,
): Promise<ApiResult<ChannelOverride[]>> {
  return apiRequest<ChannelOverride[]>(
    `/v1/channels/${channelId}/permissions`,
    {
      method: "GET",
      token,
    },
  );
}

interface SetChannelOverrideInput {
  allow: ChannelOverridePermission[];
  deny: ChannelOverridePermission[];
}

export function setChannelOverride(
  token: string,
  channelId: string,
  roleId: string,
  input: SetChannelOverrideInput,
): Promise<ApiResult<ChannelOverride | null>> {
  return apiRequest<ChannelOverride | null>(
    `/v1/channels/${channelId}/permissions/roles/${roleId}`,
    { method: "PUT", token, data: input },
  );
}

export function deleteChannelOverride(
  token: string,
  channelId: string,
  roleId: string,
): Promise<ApiResult<void>> {
  return apiRequest<void>(
    `/v1/channels/${channelId}/permissions/roles/${roleId}`,
    { method: "DELETE", token },
  );
}

interface MemberChannelPermissions {
  channel_id: string;
  user_id: string;
  permissions: string[];
}

export function getMemberChannelPermissions(
  token: string,
  channelId: string,
  userId: string,
): Promise<ApiResult<MemberChannelPermissions>> {
  return apiRequest<MemberChannelPermissions>(
    `/v1/channels/${channelId}/members/${userId}/permissions`,
    { method: "GET", token },
  );
}
