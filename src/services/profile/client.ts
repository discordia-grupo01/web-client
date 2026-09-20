import {
  type GetOwnProfileResult,
  type GetPublicProfileResult,
  OWN_PROFILE_LOAD_FAILED,
  PROFILE_LOAD_FAILED,
  PROFILE_UPDATE_FAILED,
  STATUS_CLEAR_FAILED,
  STATUS_UPDATE_FAILED,
  type UpdateCustomStatusResult,
  type UpdateOwnProfileResult,
} from "@discordia/client-shared";

import { api } from "@/lib/browser-api-client";

/**
 * Llamadas del navegador hacia el BFF (`/api/profile`, `/api/users/:id`,
 * mismo origen). Nunca pega directo a identify-service.
 */

export async function getPublicProfileRequest(
  userId: string,
): Promise<GetPublicProfileResult> {
  try {
    const { data } = await api.get<GetPublicProfileResult>(`/users/${userId}`);
    return data;
  } catch {
    return {
      ok: false,
      message: PROFILE_LOAD_FAILED,
    };
  }
}

export async function getOwnProfileRequest(): Promise<GetOwnProfileResult> {
  try {
    const { data } = await api.get<GetOwnProfileResult>("/profile");
    return data;
  } catch {
    return {
      ok: false,
      message: OWN_PROFILE_LOAD_FAILED,
    };
  }
}

/**
 * `formData` va tal cual (multipart/form-data): le sacamos el
 * `Content-Type: application/json` que trae la instancia por default, igual
 * que `createServerRequest` en services/servers/client.ts.
 */
export async function updateOwnProfileRequest(
  formData: FormData,
): Promise<UpdateOwnProfileResult> {
  try {
    const { data } = await api.patch<UpdateOwnProfileResult>(
      "/profile",
      formData,
      { headers: { "Content-Type": undefined } },
    );
    return data;
  } catch {
    return {
      ok: false,
      message: PROFILE_UPDATE_FAILED,
    };
  }
}

export async function updateCustomStatusRequest(
  statusText: string,
): Promise<UpdateCustomStatusResult> {
  try {
    const { data } = await api.put<UpdateCustomStatusResult>(
      "/profile/status",
      { status_text: statusText },
    );
    return data;
  } catch {
    return {
      ok: false,
      message: STATUS_UPDATE_FAILED,
    };
  }
}

export async function clearCustomStatusRequest(): Promise<UpdateCustomStatusResult> {
  try {
    const { data } =
      await api.delete<UpdateCustomStatusResult>("/profile/status");
    return data;
  } catch {
    return {
      ok: false,
      message: STATUS_CLEAR_FAILED,
    };
  }
}
