import type { User } from "./auth.types";

/** Forma de error del backend: `{ error: { code, message, details? } }`. */
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface PublicUser {
  id: string;
  name: string;
  avatar_url: string;
  status_text: string;
  status_emoji: string;
  created_at: string;
  mutual_server_ids: string[];
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
