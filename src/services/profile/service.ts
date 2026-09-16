import "server-only";

import { apiRequest, type ApiResult } from "@/lib/api-client";
import { env } from "@/lib/env";
import type { User } from "@/services/auth/types";

import type { ApiErrorBody, PublicUser } from "./types";

/**
 * Capa de servicios contra identify-service: perfil de usuario (propio o
 * publico). Ver `services/auth/service.ts` para login/register/logout/reset.
 *
 * Endpoints reales (ver identify-service/openapi.yaml):
 *   GET   /v1/users/:id           -> 200 PublicUser | 400 | 401 | 404 (Bearer)
 *   GET   /v1/me/profile          -> 200 User | 401 | 404 (Bearer)
 *   PATCH /v1/me/profile          -> 200 User | 400 | 401 | 404 (Bearer, multipart)
 */

export function getPublicProfile(
  token: string,
  userId: string,
): Promise<ApiResult<PublicUser>> {
  return apiRequest<PublicUser>(`/v1/users/${userId}`, {
    method: "GET",
    token,
  });
}

export function getOwnProfile(token: string): Promise<ApiResult<User>> {
  return apiRequest<User>("/v1/me/profile", { method: "GET", token });
}

interface ProfileUpdateSuccess {
  ok: true;
  status: number;
  data: User;
}
interface ProfileUpdateFailure {
  ok: false;
  status: number;
  message: string;
  details?: Record<string, unknown>;
}
export type ProfileUpdateResult = ProfileUpdateSuccess | ProfileUpdateFailure;

/**
 * `PATCH /v1/me/profile` es multipart/form-data (name/description/image,
 * todos opcionales). Fetch nativo en vez de la instancia axios de
 * lib/api-client.ts, igual que `createServer` en services/servers/service.ts:
 * asi Node arma el boundary del FormData sin ambiguedad.
 */
export async function updateOwnProfile(
  token: string,
  formData: FormData,
): Promise<ProfileUpdateResult> {
  try {
    const response = await fetch(`${env.apiUrl}/v1/me/profile`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const body = await response.json().catch(() => undefined);

    if (response.ok) {
      return { ok: true, status: response.status, data: body as User };
    }

    const errorBody = body as ApiErrorBody | undefined;
    return {
      ok: false,
      status: response.status,
      message:
        errorBody?.error?.message ??
        "Ocurrio un error inesperado. Intenta de nuevo.",
      details: errorBody?.error?.details,
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

interface ProfileImageSuccess {
  ok: true;
  status: number;
  body: ReadableStream<Uint8Array>;
  contentType: string;
}
interface ProfileImageFailure {
  ok: false;
  status: number;
}
export type ProfileImageResult = ProfileImageSuccess | ProfileImageFailure;

/**
 * Trae el binario de una imagen de perfil ya subida. `imagePath` es el valor
 * de `avatar_url` tal cual lo devuelve el backend (ej.
 * `/uploads/profile-images/<id>.jpg`, servido sin auth por identify-service
 * -- ver `router.Static` en cmd/api/main.go).
 */
export async function getProfileImage(
  imagePath: string,
): Promise<ProfileImageResult> {
  const response = await fetch(`${env.apiUrl}${imagePath}`);

  if (!response.ok || !response.body) {
    return { ok: false, status: response.status || 502 };
  }

  return {
    ok: true,
    status: response.status,
    body: response.body,
    contentType: response.headers.get("content-type") ?? "image/jpeg",
  };
}
