import { api } from "@/lib/browser-api-client";

import type {
  GetOwnProfileActionResult,
  GetPublicProfileActionResult,
  UpdateOwnProfileActionResult,
} from "./types";

/**
 * Llamadas del navegador hacia el BFF (`/api/profile`, `/api/users/:id`,
 * mismo origen). Nunca pega directo a identify-service.
 */

export async function getPublicProfileRequest(
  userId: string,
): Promise<GetPublicProfileActionResult> {
  try {
    const { data } = await api.get<GetPublicProfileActionResult>(
      `/users/${userId}`,
    );
    return data;
  } catch {
    return {
      ok: false,
      message: "No pudimos cargar el perfil.",
    };
  }
}

export async function getOwnProfileRequest(): Promise<GetOwnProfileActionResult> {
  try {
    const { data } = await api.get<GetOwnProfileActionResult>("/profile");
    return data;
  } catch {
    return {
      ok: false,
      message: "No pudimos cargar tu perfil.",
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
): Promise<UpdateOwnProfileActionResult> {
  try {
    const { data } = await api.patch<UpdateOwnProfileActionResult>(
      "/profile",
      formData,
      { headers: { "Content-Type": undefined } },
    );
    return data;
  } catch {
    return {
      ok: false,
      message: "No pudimos actualizar tu perfil. Intenta de nuevo.",
    };
  }
}
