import type { Category } from "./category.types";
import type { Channel } from "./channel.types";

/** Servidor tal como lo devuelve el servicio `servers` (via el gateway). */
export interface ServerSummary {
  id: string;
  name: string;
  icon_url: string | null;
  owner_id: string;
  created_at: string;
  channels: Channel[];
  categories: Category[];
}

/** Forma de error de `servers`: `{ error: { code, message, details? } }`. */
export interface ServersApiErrorBody {
  error: {
    code: number;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface CreateServerFieldErrors {
  name?: string;
  icon?: string;
}

/** Resultado de `POST /api/servers`. Nunca incluye el token. */
export type CreateServerActionResult =
  | { ok: true; server: ServerSummary }
  | { ok: false; message: string; fieldErrors?: CreateServerFieldErrors };

/**
 * Resultado de `DELETE /api/servers/:id/leave`. El backend bloquea esto para
 * el owner (409, `details.reason: "owner_must_transfer_or_delete"`): en ese
 * caso `isOwnerBlocked` es `true` y `message` ya viene con la copia final.
 */
export type LeaveServerActionResult =
  { ok: true } | { ok: false; message: string; isOwnerBlocked?: boolean };
