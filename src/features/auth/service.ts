import "server-only";

import { apiRequest, type ApiResult } from "@/lib/api-client";
import { env } from "@/lib/env";

import type { ApiErrorBody, AuthResponse, PublicUser, User } from "./types";

/**
 * Capa de servicios contra identify-service.
 *
 * Endpoints reales (ver identify-service/openapi.yaml):
 *   POST  /v1/users              -> 201 User (SIN token) | 400 | 409 (email en uso)
 *   POST  /v1/login               -> 200 { user, token } | 400 | 401 INVALID_CREDENTIALS
 *   POST  /v1/logout              -> 204 (Bearer) | 401 SESSION_EXPIRED
 *   POST  /v1/password-recovery   -> 202 (siempre, exista o no el email) | 400 | 429 RECOVERY_RATE_LIMITED
 *   POST  /v1/password-reset      -> 200 | 400 (PASSWORDS_DO_NOT_MATCH | INSECURE_PASSWORD | INVALID_RESET_TOKEN)
 *   GET   /v1/users/:id           -> 200 PublicUser | 400 | 401 | 404 (Bearer)
 *   GET   /v1/me/profile          -> 200 User | 401 | 404 (Bearer)
 *   PATCH /v1/me/profile          -> 200 User | 400 | 401 | 404 (Bearer, multipart)
 *
 * Todavia NO existen en el backend: refresh, oauth/{provider}, 2fa/*, pin/*,
 * PUT/DELETE /v1/me/status (estado personalizado -- historia optativa aparte).
 * Cuando aparezcan se agregan aca.
 */

/** Ya no devuelve token: registrarse no crea sesion, ver types.ts. */
export function register(data: {
  name: string;
  email: string;
  password: string;
}): Promise<ApiResult<User>> {
  return apiRequest<User>("/v1/users", {
    method: "POST",
    data,
  });
}

export function login(credentials: {
  email: string;
  password: string;
}): Promise<ApiResult<AuthResponse>> {
  return apiRequest<AuthResponse>("/v1/login", {
    method: "POST",
    data: credentials,
  });
}

export function logout(token: string): Promise<ApiResult<void>> {
  return apiRequest<void>("/v1/logout", {
    method: "POST",
    token,
  });
}

export function recoverPassword(
  email: string,
): Promise<ApiResult<{ message: string }>> {
  return apiRequest<{ message: string }>("/v1/password-recovery", {
    method: "POST",
    data: { email },
  });
}

export function resetPassword(data: {
  token: string;
  new_password: string;
  confirm_password: string;
}): Promise<ApiResult<{ message: string }>> {
  return apiRequest<{ message: string }>("/v1/password-reset", {
    method: "POST",
    data,
  });
}

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
 * lib/api-client.ts, igual que `createServer` en features/servers/service.ts:
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
      message: "No pudimos conectar con el servidor. Intenta de nuevo en un momento.",
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
