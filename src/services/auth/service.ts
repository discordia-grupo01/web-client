import "server-only";

import { apiRequest, type ApiResult } from "@/lib/api-client";

import type { AuthResponse, User } from "./types";

/**
 * Capa de servicios contra identify-service: registro, login, logout y
 * recuperacion/reset de contrasena. Ver `services/profile/service.ts` para
 * el perfil de usuario (propio o publico).
 *
 * Endpoints reales (ver identify-service/openapi.yaml):
 *   POST  /v1/users              -> 201 User (SIN token) | 400 | 409 (email en uso)
 *   POST  /v1/login               -> 200 { user, token } | 400 | 401 INVALID_CREDENTIALS
 *   POST  /v1/logout              -> 204 (Bearer) | 401 SESSION_EXPIRED
 *   POST  /v1/password-recovery   -> 202 (siempre, exista o no el email) | 400 | 429 RECOVERY_RATE_LIMITED
 *   POST  /v1/password-reset      -> 200 | 400 (PASSWORDS_DO_NOT_MATCH | INSECURE_PASSWORD | INVALID_RESET_TOKEN)
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
