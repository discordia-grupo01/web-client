/** Transferencia de propiedad tal como la devuelve `servers`. */
export interface OwnershipTransfer {
  id: string;
  server_id: string;
  from_user_id: string;
  to_user_id: string;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  created_at: string;
  resolved_at: string | null;
}

export interface TransferOwnershipFieldErrors {
  to_user_id?: string;
}

/** Resultado de `POST /api/servers/:id/ownership-transfers`. */
export type InitiateTransferActionResult =
  | { ok: true; transfer: OwnershipTransfer }
  | { ok: false; message: string; fieldErrors?: TransferOwnershipFieldErrors };

/**
 * Resultado de `GET /api/servers/:id/ownership-transfers/pending`. `transfer`
 * es `null` cuando el servidor no tiene ninguna transferencia pendiente (el
 * backend responde 404 en ese caso -- no es un error, se normaliza acá).
 */
export type GetPendingTransferActionResult =
  | { ok: true; transfer: OwnershipTransfer | null }
  | { ok: false; message: string };

/** Resultado de aceptar/rechazar/cancelar (`POST .../:transferId/<accion>`). */
export type RespondTransferActionResult =
  | { ok: true; transfer: OwnershipTransfer }
  | { ok: false; message: string };
