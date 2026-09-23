import {
  type CreateServerResult,
  type LeaveServerResult,
  REQUEST_FAILED_MESSAGE,
  SERVER_UPDATE_FAILED,
  SERVERS_LOAD_FAILED,
  type ServerSummary,
  type UpdateServerResult,
} from "@discordia/client-shared";

import { api } from "@/lib/browser-api-client";

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
): Promise<LeaveServerResult> {
  try {
    const { data } = await api.delete<LeaveServerResult>(
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
): Promise<CreateServerResult> {
  try {
    const { data } = await api.post<CreateServerResult>("/servers", formData, {
      headers: { "Content-Type": undefined },
    });
    return data;
  } catch {
    return {
      ok: false,
      message: REQUEST_FAILED_MESSAGE,
    };
  }
}

export async function updateServerRequest(
  serverId: string,
  formData: FormData,
): Promise<UpdateServerResult> {
  try {
    const { data } = await api.patch<UpdateServerResult>(
      `/servers/${serverId}`,
      formData,
      { headers: { "Content-Type": undefined } },
    );
    return data;
  } catch {
    return {
      ok: false,
      message: SERVER_UPDATE_FAILED,
    };
  }
}
