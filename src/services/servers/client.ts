import {
  REQUEST_FAILED_MESSAGE,
  SERVERS_LOAD_FAILED,
} from "@discordia/client-shared";

import { api } from "@/lib/browser-api-client";

import type {
  CreateServerActionResult,
  LeaveServerActionResult,
  ServerSummary,
} from "@/types/server.types";

/**
 * Llamadas del navegador hacia el BFF (`/api/servers`, mismo origen): alta,
 * listado y salida del servidor en si. Canales, categorias, roles,
 * invitaciones y miembros tienen cada uno su propio
 * `services/<dominio>/client.ts`.
 */

type ListServersResult =
  { ok: true; servers: ServerSummary[] } | { ok: false; message: string };

export async function listServersRequest(): Promise<ListServersResult> {
  try {
    const { data } = await api.get<ListServersResult>("/servers");
    return data;
  } catch {
    return {
      ok: false,
      message: SERVERS_LOAD_FAILED,
    };
  }
}

export async function leaveServerRequest(
  serverId: string,
): Promise<LeaveServerActionResult> {
  try {
    const { data } = await api.delete<LeaveServerActionResult>(
      `/servers/${serverId}/leave`,
    );
    return data;
  } catch {
    return {
      ok: false,
      message: REQUEST_FAILED_MESSAGE,
    };
  }
}

/**
 * `formData` va tal cual (multipart/form-data): le sacamos el
 * `Content-Type: application/json` que trae la instancia por default para
 * que el navegador arme solo el boundary del multipart.
 */
export async function createServerRequest(
  formData: FormData,
): Promise<CreateServerActionResult> {
  try {
    const { data } = await api.post<CreateServerActionResult>(
      "/servers",
      formData,
      { headers: { "Content-Type": undefined } },
    );
    return data;
  } catch {
    return {
      ok: false,
      message: REQUEST_FAILED_MESSAGE,
    };
  }
}
