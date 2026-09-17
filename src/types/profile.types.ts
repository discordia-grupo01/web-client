import type { User } from "./auth.types";

/** Forma de error del backend: `{ error: { code, message, details? } }`. */
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * `GET /v1/users/:id`: solo los campos públicos (CA1 de "Visualización de
 * perfil público" es una lista cerrada). A diferencia de `User` (perfil
 * propio), no trae `created_at`: la fecha de registro no está en esa lista.
 */
export interface PublicUser {
  id: string;
  name: string;
  description: string;
  avatar_url: string;
  status_text: string;
  status_emoji: string;
  mutual_server_ids: string[];
  /**
   * CA3 de "Visualización de perfil público" (perfil suspendido). Opcional
   * porque identify-service no tiene ningún concepto de suspensión hoy (sin
   * campo, sin código de error): siempre llega `undefined`. Se deja tipado
   * para que el front ya sepa mostrarlo en cuanto el backend lo agregue.
   */
  is_suspended?: boolean;
}

/** Resultado de `GET /api/users/:id`. */
export type GetPublicProfileActionResult =
  { ok: true; user: PublicUser } | { ok: false; message: string };

/** Resultado de `GET /api/profile` (perfil propio, `GET /v1/me/profile`). */
export type GetOwnProfileActionResult =
  { ok: true; user: User } | { ok: false; message: string };

/**
 * Resultado de `PATCH /api/profile` (edicion de perfil propio,
 * `PATCH /v1/me/profile`).
 */
export type UpdateOwnProfileActionResult =
  | { ok: true; user: User }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

/**
 * Resultado de `PUT /api/profile/status` y `DELETE /api/profile/status`
 * (estado personalizado, `PUT`/`DELETE /v1/me/status`).
 */
export type UpdateCustomStatusActionResult =
  { ok: true; user: User } | { ok: false; message: string };
