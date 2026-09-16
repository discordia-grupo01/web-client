import "server-only";

import { apiRequest, type ApiResult } from "@/lib/api-client";
import { env } from "@/lib/env";

import type { ServerSummary, ServersApiErrorBody } from "./types";

/**
 * Capa de servicios contra el servicio `servers` (via el gateway Kong):
 * operaciones core sobre el servidor en si (listar, crear, obtener, salir,
 * icono). Canales, categorias, roles, invitaciones y miembros tienen cada
 * uno su propio `services/<dominio>/service.ts` -- son sub-recursos del
 * mismo servicio de backend, pero se separaron por dominio de UI/negocio en
 * el front para no amontonar todo en un solo archivo.
 *
 * Endpoints reales (ver servers/internal/handler):
 *   GET    /v1/servers                          -> 200 [Server] | 401
 *   GET    /v1/servers/:id                      -> 200 Server | 400 | 404
 *   POST   /v1/servers                           -> 201 Server | 400 | 401 | 409 (nombre repetido)
 *   DELETE /v1/servers/:id/members/:userId       -> 204 | 401 | 403 | 404 | 409 (owner)
 *   GET    /v1/servers/:id/icon                  -> binario | 401 | 404
 *
 * Todavia NO existen: editar/borrar servidor. Ver la referencia de la API
 * para transferencia de ownership.
 */

export function listMyServers(
  token: string,
): Promise<ApiResult<ServerSummary[]>> {
  return apiRequest<ServerSummary[]>("/v1/servers", {
    method: "GET",
    token,
  });
}

export function getServer(
  token: string,
  serverId: string,
): Promise<ApiResult<ServerSummary>> {
  return apiRequest<ServerSummary>(`/v1/servers/${serverId}`, {
    method: "GET",
    token,
  });
}

/**
 * Solo self-leave: el backend rechaza con 403 si `userId` no es el del
 * caller (no hay endpoint de "kick" en esta ruta), y con 409 si el caller
 * es el owner del servidor (tiene que transferir la propiedad o borrarlo).
 */
export function leaveServer(
  token: string,
  serverId: string,
  userId: string,
): Promise<ApiResult<void>> {
  return apiRequest<void>(`/v1/servers/${serverId}/members/${userId}`, {
    method: "DELETE",
    token,
  });
}

interface ServerIconSuccess {
  ok: true;
  status: number;
  body: ReadableStream<Uint8Array>;
  contentType: string;
}
interface ServerIconFailure {
  ok: false;
  status: number;
}
export type ServerIconResult = ServerIconSuccess | ServerIconFailure;

/**
 * `GET /v1/servers/:id/icon` exige JWT (via el plugin jwt de Kong), y un
 * `<img src="...">` del navegador no puede mandar el header Authorization
 * -- por eso esto vive del lado server y usa fetch nativo en vez de
 * `apiRequest` (pensada para JSON): devolvemos el binario tal cual, sin
 * parsear.
 */
export async function getServerIcon(
  token: string,
  serverId: string,
): Promise<ServerIconResult> {
  const response = await fetch(`${env.apiUrl}/v1/servers/${serverId}/icon`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok || !response.body) {
    return { ok: false, status: response.status || 502 };
  }

  return {
    ok: true,
    status: response.status,
    body: response.body,
    contentType: response.headers.get("content-type") ?? "image/png",
  };
}

interface ServersServiceSuccess<T> {
  ok: true;
  status: number;
  data: T;
}
interface ServersServiceFailure {
  ok: false;
  status: number;
  message: string;
  details?: Record<string, unknown>;
}
export type ServersServiceResult<T> =
  ServersServiceSuccess<T> | ServersServiceFailure;

/**
 * `POST /v1/servers` es multipart/form-data (name + icon opcional). Usamos
 * fetch nativo en vez de la instancia axios de lib/api-client.ts (pensada
 * para JSON): asi Node arma el boundary del FormData sin ambiguedad.
 */
export async function createServer(
  token: string,
  formData: FormData,
): Promise<ServersServiceResult<ServerSummary>> {
  try {
    const response = await fetch(`${env.apiUrl}/v1/servers`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const body = await response.json().catch(() => undefined);

    if (response.ok) {
      return {
        ok: true,
        status: response.status,
        data: body as ServerSummary,
      };
    }

    const err = body as ServersApiErrorBody | undefined;
    return {
      ok: false,
      status: response.status,
      message: err?.error?.message ?? "Ocurrio un error inesperado.",
      details: err?.error?.details,
    };
  } catch {
    return {
      ok: false,
      status: 0,
      message:
        "No pudimos conectar con el servidor. Intenta de nuevo en un momento.",
    };
  }
}
