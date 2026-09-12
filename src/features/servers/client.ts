import { api } from "@/lib/browser-api-client";

import type {
  CreateServerActionResult,
  JoinServerActionResult,
  LeaveServerActionResult,
  ServerSummary,
} from "./types";

/**
 * Llamadas del navegador hacia el BFF (`/api/servers`, mismo origen).
 * Nunca pega directo al gateway: el JWT nunca sale del servidor de Next.
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
      message: "No pudimos cargar tus servidores. Intenta de nuevo.",
    };
  }
}

/** Acepta tanto un link completo (".../xY7z2Q") como el código pelado. */
export function normalizeInviteCode(raw: string): string {
  const match = raw.trim().match(/([A-Za-z0-9_-]{4,20})$/);
  return match ? match[1] : raw.trim();
}

export async function joinServerRequest(
  code: string,
): Promise<JoinServerActionResult> {
  try {
    const { data } = await api.post<JoinServerActionResult>(
      `/invites/${encodeURIComponent(code)}/join`,
    );
    return data;
  } catch {
    return {
      ok: false,
      message: "No pudimos procesar la solicitud. Intenta de nuevo.",
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
      message: "No pudimos procesar la solicitud. Intenta de nuevo.",
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
      message: "No pudimos procesar la solicitud. Intenta de nuevo.",
    };
  }
}
