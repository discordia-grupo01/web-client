/** Canal tal como viene embebido en la respuesta de un servidor. */
export interface Channel {
  id: string;
  name: string;
  kind: "text" | "voice";
  position: number;
}

/** Servidor tal como lo devuelve el servicio `servers` (via el gateway). */
export interface ServerSummary {
  id: string;
  name: string;
  icon_url: string | null;
  owner_id: string;
  created_at: string;
  channels: Channel[];
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

export interface JoinServerFieldErrors {
  code?: string;
}

/** Resultado de `POST /api/invites/:code/join`. */
export type JoinServerActionResult =
  | { ok: true; server: ServerSummary; alreadyMember: boolean }
  | { ok: false; message: string; fieldErrors?: JoinServerFieldErrors };

/**
 * `ServerSummary` tal como lo maneja el front en memoria: agrega si el
 * usuario subió un ícono propio. El backend no distingue esto en su
 * respuesta (siempre manda un `icon_url`, incluso el generado por default),
 * asi que esta info solo existe del lado del front, en el momento de crear
 * el servidor -- por eso un server cargado por `GET /v1/servers` (de una
 * sesion anterior) arranca en `false`: no hay forma de saber si su icono es
 * uno que el usuario eligio o el default generado por el back.
 */
export interface ServerListItem extends ServerSummary {
  hasCustomIcon: boolean;
}
