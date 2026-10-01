import {
  BAN_PAGE_LIMIT,
  type Ban,
  type BanListResponse,
} from "@discordia/client-shared";

import "server-only";

import { apiRequest, type ApiResult } from "@/lib/apiClient";

/**
 * Capa de servicios contra el servicio `servers` (via el gateway Kong) para
 * baneos. Ver `services/servers/service.ts` para el resto de los endpoints de
 * `servers` y las notas generales sobre el back.
 *
 * Endpoints reales (ver servers/internal/handler/moderation_handler):
 *   POST   /v1/servers/:id/bans          -> 201 Ban | 400 | 401 | 403 | 404 | 409
 *   GET    /v1/servers/:id/bans          -> 200 { bans, total, limit, offset } | 400 | 401 | 403 | 404
 *   DELETE /v1/servers/:id/bans/:userId  -> 204 | 400 | 401 | 403 | 404
 *
 * Todos exigen `BAN_MEMBERS` (el owner lo tiene implicito). Banear ademas
 * exige que el objetivo sea un miembro de rango estrictamente menor al del
 * actor; revocar no tiene chequeo de jerarquia.
 */

interface ListedBans {
  bans: Ban[];
  total: number;
}

/**
 * Trae TODOS los baneos. El back pagina (maximo 100 por request) y devuelve
 * solo el `user_id`, sin nombre ni filtro por texto: buscar por nombre de
 * usuario y paginar en pantalla lo hace el front, asi que necesita la lista
 * completa. Las paginas se piden en orden; se corta si el back devuelve una
 * vacia aunque falten items (un baneo revocado entre dos requests).
 */
export async function listBans(
  token: string,
  serverId: string,
): Promise<ApiResult<ListedBans>> {
  const bans: Ban[] = [];
  let total = 0;

  do {
    const page = await apiRequest<BanListResponse>(
      `/v1/servers/${serverId}/bans?limit=${BAN_PAGE_LIMIT}&offset=${bans.length}`,
      { method: "GET", token },
    );
    if (!page.ok) return page;
    if (page.data.bans.length === 0) break;
    bans.push(...page.data.bans);
    total = page.data.total;
  } while (bans.length < total);

  return { ok: true, status: 200, data: { bans, total: bans.length } };
}

/** `reason` es opcional (max 512 runas). 409 si el usuario ya esta baneado. */
export function banMember(
  token: string,
  serverId: string,
  userId: string,
  reason: string | null,
): Promise<ApiResult<Ban>> {
  return apiRequest<Ban>(`/v1/servers/${serverId}/bans`, {
    method: "POST",
    token,
    data: { user_id: userId, reason },
  });
}

/**
 * El usuario no vuelve a ser miembro: puede reingresar con cualquier
 * invitacion valida y recibe el rol por defecto como cualquier miembro nuevo.
 */
export function unbanMember(
  token: string,
  serverId: string,
  userId: string,
): Promise<ApiResult<void>> {
  return apiRequest<void>(`/v1/servers/${serverId}/bans/${userId}`, {
    method: "DELETE",
    token,
  });
}
