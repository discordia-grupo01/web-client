import { type Invitation } from "@discordia/client-shared";

import "server-only";

import { apiRequest, type ApiResult } from "@/lib/api-client";

/**
 * Capa de servicios contra el servicio `servers` (via el gateway Kong) para
 * invitaciones. Ver `services/servers/service.ts` para el resto de los
 * endpoints de `servers` y las notas generales sobre el back.
 *
 * Endpoints reales (ver servers/internal/handler):
 *   POST   /v1/servers/:id/invites                -> 201 Invitation | 400 | 401 | 403 | 404
 *   GET    /v1/servers/:id/invites                -> 200 [Invitation] | 401 | 403 | 404
 *   DELETE /v1/invites/:code                       -> 204 (idempotente) | 401 | 403
 *   POST   /v1/invites/:code/join                -> 200|201 { server_id, already_member } | 403 | 404
 *
 * Todavia NO existe preview de una invitacion sin unirse.
 */

/**
 * Cualquier miembro del server puede generar/revocar invitaciones (no es
 * owner-only): el back solo chequea membresia, ver
 * internal/service/invitation/service.go.
 */
export function generateInvitation(
  token: string,
  serverId: string,
  maxUses?: number,
): Promise<ApiResult<Invitation>> {
  return apiRequest<Invitation>(`/v1/servers/${serverId}/invites`, {
    method: "POST",
    token,
    data: maxUses !== undefined ? { max_uses: maxUses } : {},
  });
}

/** Cualquier miembro puede ver todas las invitaciones del server (mismo chequeo que generar/revocar). */
export function listInvitations(
  token: string,
  serverId: string,
): Promise<ApiResult<Invitation[]>> {
  return apiRequest<Invitation[]>(`/v1/servers/${serverId}/invites`, {
    method: "GET",
    token,
  });
}

/** Idempotente: revocar un codigo ya revocado igual devuelve 204. */
export function revokeInvitation(
  token: string,
  code: string,
): Promise<ApiResult<void>> {
  return apiRequest<void>(`/v1/invites/${encodeURIComponent(code)}`, {
    method: "DELETE",
    token,
  });
}

interface JoinResult {
  server_id: string;
  already_member: boolean;
}

/**
 * El backend no tiene un endpoint de "preview" de una invitacion: este
 * join es de un solo paso (a diferencia del flujo de 2 pasos del prototipo
 * de Figma, que no tiene con que hablar del lado del back todavia).
 */
export function joinServerByCode(
  token: string,
  code: string,
): Promise<ApiResult<JoinResult>> {
  return apiRequest<JoinResult>(
    `/v1/invites/${encodeURIComponent(code)}/join`,
    {
      method: "POST",
      token,
    },
  );
}
