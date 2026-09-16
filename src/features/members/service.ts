import "server-only";

import { apiRequest, type ApiResult } from "@/lib/api-client";

import type { Member } from "./types";

/**
 * Capa de servicios contra el servicio `servers` (via el gateway Kong) para
 * miembros. Ver `features/servers/service.ts` para el resto de los endpoints
 * de `servers` y las notas generales sobre el back.
 *
 * Endpoints reales (ver servers/internal/handler):
 *   GET    /v1/servers/:id/members               -> 200 { members, total, limit, offset } | 401
 */

interface MemberListResult {
  members: Member[];
  total: number;
  limit: number;
  offset: number;
}

/** Trae hasta 100 miembros (el maximo que acepta el back) en una sola pagina. */
export function listMembers(
  token: string,
  serverId: string,
): Promise<ApiResult<MemberListResult>> {
  return apiRequest<MemberListResult>(
    `/v1/servers/${serverId}/members?limit=100`,
    { method: "GET", token },
  );
}
