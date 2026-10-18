import {
  type Member,
  type MemberPageQuery,
  memberPageQueryString,
} from "@discordia/client-shared";

import "server-only";

import { apiRequest, type ApiResult } from "@/lib/apiClient";

/**
 * Capa de servicios contra el servicio `servers` (via el gateway Kong) para
 * miembros. Ver `services/servers/service.ts` para el resto de los endpoints
 * de `servers` y las notas generales sobre el back.
 *
 * Endpoints reales (ver servers/internal/handler):
 *   GET    /v1/servers/:id/members?q&limit&offset  -> 200 { members, total, limit, offset } | 401
 */

interface MemberListResult {
  members: Member[];
  total: number;
  limit: number;
  offset: number;
}

/** Una pagina de miembros, opcionalmente filtrada por nombre (`search`). */
export function listMembers(
  token: string,
  serverId: string,
  query: MemberPageQuery,
): Promise<ApiResult<MemberListResult>> {
  return apiRequest<MemberListResult>(
    `/v1/servers/${serverId}/members${memberPageQueryString(query)}`,
    { method: "GET", token },
  );
}
