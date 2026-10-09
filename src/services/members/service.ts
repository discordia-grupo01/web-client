import { type Member, MEMBER_PAGE_LIMIT } from "@discordia/client-shared";

import "server-only";

import { apiRequest, type ApiResult } from "@/lib/apiClient";

/**
 * Capa de servicios contra el servicio `servers` (via el gateway Kong) para
 * miembros. Ver `services/servers/service.ts` para el resto de los endpoints
 * de `servers` y las notas generales sobre el back.
 *
 * Endpoints reales (ver servers/internal/handler):
 *   GET    /v1/servers/:id/members?limit&offset  -> 200 { members, total, limit, offset } | 401
 */

interface MemberListResult {
  members: Member[];
  total: number;
  limit: number;
  offset: number;
}

/** Una pagina de hasta 100 miembros (el maximo que acepta el back), desde `offset`. */
export function listMembers(
  token: string,
  serverId: string,
  offset = 0,
): Promise<ApiResult<MemberListResult>> {
  return apiRequest<MemberListResult>(
    `/v1/servers/${serverId}/members?limit=${MEMBER_PAGE_LIMIT}&offset=${offset}`,
    { method: "GET", token },
  );
}
