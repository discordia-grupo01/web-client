import {
  type ApiErrorBody,
  NETWORK_ERROR_MESSAGE,
  UNEXPECTED_ERROR_MESSAGE,
} from "@discordia/client-shared";

import "server-only";

import { apiRequest, type ApiResult } from "@/lib/api-client";
import { env } from "@/lib/env";
import type { User } from "@/types/auth.types";

import type { PublicUser } from "@/types/profile.types";

/**
 * Capa de servicios contra identify-service: perfil de usuario (propio o
 * publico). Ver `services/auth/service.ts` para login/register/logout/reset.
 *
 * Endpoints reales (ver identify-service/openapi.yaml):
 *   GET    /v1/users/:id           -> 200 PublicUser | 400 | 401 | 404 (Bearer)
 *   GET    /v1/me/profile          -> 200 User | 401 | 404 (Bearer)
 *   PATCH  /v1/me/profile          -> 200 User | 400 | 401 | 404 (Bearer, multipart)
 *   PUT    /v1/me/status           -> 200 User | 400 | 401 | 404 (Bearer, JSON)
 *   DELETE /v1/me/status           -> 204 | 401 | 404 (Bearer)
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

export interface StatusUpdateBody {
  status_text?: string;
  status_emoji?: string;
}

export function updateStatus(
  token: string,
  body: StatusUpdateBody,
): Promise<ApiResult<User>> {
  return apiRequest<User>("/v1/me/status", {
    method: "PUT",
    token,
    data: body,
  });
}

export function clearStatus(token: string): Promise<ApiResult<void>> {
  return apiRequest<void>("/v1/me/status", { method: "DELETE", token });
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
      message: errorBody?.error?.message ?? UNEXPECTED_ERROR_MESSAGE,
      details: errorBody?.error?.details,
    };
  } catch {
    return {
      ok: false,
      status: 0,
      message: NETWORK_ERROR_MESSAGE,
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
 * Trae el binario de una imagen de perfil ya subida. Acepta tanto rutas
 * relativas servidas por identify-service como URLs publicas de Supabase
 * Storage.
 */
export async function getProfileImage(
  imagePath: string,
): Promise<ProfileImageResult> {
  const imageURL = /^https?:\/\//i.test(imagePath)
    ? imagePath
    : `${env.apiUrl}${imagePath}`;
  const response = await fetch(imageURL);

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
