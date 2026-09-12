import "server-only";

import { apiRequest, type ApiResult } from "@/lib/api-client";
import { env } from "@/lib/env";

import type { ServerSummary, ServersApiErrorBody } from "./types";

/**
 * Capa de servicios contra el servicio `servers` (via el gateway Kong).
 *
 * Endpoints reales (ver servers/internal/handler):
 *   GET  /v1/servers                 -> 200 [Server] | 401
 *   GET  /v1/servers/:id             -> 200 Server | 400 | 404
 *   POST /v1/servers                  -> 201 Server | 400 | 401 | 409 (nombre repetido)
 *   POST /v1/invites/:code/join       -> 200|201 { server_id, already_member } | 403 | 404
 *
 * Todavia NO existen: editar/borrar servidor, ABMC de canales/categorias,
 * listar miembros, preview de una invitacion sin unirse. Ver la referencia
 * de la API para el resto de endpoints (roles, transferencia de ownership).
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
