import "server-only";

import { apiRequest, type ApiResult } from "@/lib/api-client";

import type { OwnershipTransfer } from "@/types/ownership-transfer.types";

/**
 * Capa de servicios contra el servicio `servers` (via el gateway Kong) para
 * transferencia de propiedad. Ver `services/servers/service.ts` para el
 * resto de los endpoints de `servers` y las notas generales sobre el back.
 *
 * Endpoints reales (ver servers/internal/handler/ownership_transfer_handler):
 *   POST /v1/servers/:id/ownership-transfers                    -> 201 OwnershipTransfer | 400 | 401 | 403 | 404 | 409
 *   GET  /v1/servers/:id/ownership-transfers/pending             -> 200 OwnershipTransfer | 401 | 403 | 404 (sin pendiente)
 *   POST /v1/servers/:id/ownership-transfers/:transferId/accept  -> 200 OwnershipTransfer | 401 | 403 | 404 | 409
 *   POST /v1/servers/:id/ownership-transfers/:transferId/reject  -> 200 OwnershipTransfer | 401 | 403 | 404 | 409
 *   POST /v1/servers/:id/ownership-transfers/:transferId/cancel  -> 200 OwnershipTransfer | 401 | 403 | 404 | 409
 */

/**
 * Solo el owner puede iniciar una transferencia, y solo hacia otro miembro
 * del servidor (400 `to_user_id`/`not_a_member` si no lo es -- ver
 * internal/service/ownership_transfer_service.go). El back rechaza con 409
 * si ya hay una pendiente: solo puede haber una a la vez por servidor.
 */
export function initiateOwnershipTransfer(
  token: string,
  serverId: string,
  toUserId: string,
): Promise<ApiResult<OwnershipTransfer>> {
  return apiRequest<OwnershipTransfer>(
    `/v1/servers/${serverId}/ownership-transfers`,
    { method: "POST", token, data: { to_user_id: toUserId } },
  );
}

/**
 * Cualquier miembro del servidor puede consultarla (no solo el owner o el
 * destinatario). 404 significa "no hay ninguna pendiente", no un error.
 */
export function getPendingOwnershipTransfer(
  token: string,
  serverId: string,
): Promise<ApiResult<OwnershipTransfer>> {
  return apiRequest<OwnershipTransfer>(
    `/v1/servers/${serverId}/ownership-transfers/pending`,
    { method: "GET", token },
  );
}

/** Solo el destinatario (`to_user_id`) puede aceptar. Al aceptar pasa a ser el nuevo owner. */
export function acceptOwnershipTransfer(
  token: string,
  serverId: string,
  transferId: string,
): Promise<ApiResult<OwnershipTransfer>> {
  return apiRequest<OwnershipTransfer>(
    `/v1/servers/${serverId}/ownership-transfers/${transferId}/accept`,
    { method: "POST", token },
  );
}

/** Solo el destinatario (`to_user_id`) puede rechazar. El owner original conserva el servidor. */
export function rejectOwnershipTransfer(
  token: string,
  serverId: string,
  transferId: string,
): Promise<ApiResult<OwnershipTransfer>> {
  return apiRequest<OwnershipTransfer>(
    `/v1/servers/${serverId}/ownership-transfers/${transferId}/reject`,
    { method: "POST", token },
  );
}

/** Solo quien la inició (`from_user_id`) puede cancelarla antes de que el destinatario responda. */
export function cancelOwnershipTransfer(
  token: string,
  serverId: string,
  transferId: string,
): Promise<ApiResult<OwnershipTransfer>> {
  return apiRequest<OwnershipTransfer>(
    `/v1/servers/${serverId}/ownership-transfers/${transferId}/cancel`,
    { method: "POST", token },
  );
}
