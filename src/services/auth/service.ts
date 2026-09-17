import "server-only";

import {
  apiRequest,
  apiRequestWithSetCookie,
  type ApiResult,
} from "@/lib/api-client";
import { extractCookieValue } from "@/lib/set-cookie";

import type { AuthResponse, User } from "@/types/auth.types";

const REFRESH_COOKIE_NAME = "refresh_token";

/**
 * Capa de servicios contra identify-service: registro, login, logout,
 * refresh y recuperacion/reset de contrasena. Ver `services/profile/service.ts`
 * para el perfil de usuario (propio o publico).
 *
 * Endpoints reales (ver identify-service/openapi.yaml):
 *   POST  /v1/users              -> 201 User (SIN token) | 400 | 409 (email en uso)
 *   POST  /v1/login               -> 200 { user, token } + Set-Cookie refresh_token | 400 | 401 INVALID_CREDENTIALS
 *   POST  /v1/refresh             -> 200 { user, token } + Set-Cookie refresh_token (rotado) | 401 SESSION_EXPIRED
 *   POST  /v1/logout              -> 204 (cookie refresh_token, ya no Bearer) | 401 SESSION_EXPIRED
 *   POST  /v1/password-recovery   -> 202 (siempre, exista o no el email) | 400 | 429 RECOVERY_RATE_LIMITED
 *   POST  /v1/password-reset      -> 200 | 400 (PASSWORDS_DO_NOT_MATCH | INSECURE_PASSWORD | INVALID_RESET_TOKEN)
 *
 * El refresh token nunca viaja en el body: siempre se extrae del header
 * Set-Cookie de login/refresh, y se manda de vuelta como header Cookie manual
 * en refresh/logout (el server de Next no tiene cookie jar).
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

export async function login(credentials: {
  email: string;
  password: string;
}): Promise<{ result: ApiResult<AuthResponse>; refreshToken: string | null }> {
  const { result, setCookieHeader } = await apiRequestWithSetCookie<AuthResponse>(
    "/v1/login",
    { method: "POST", data: credentials },
  );
  return {
    result,
    refreshToken: extractCookieValue(setCookieHeader, REFRESH_COOKIE_NAME),
  };
}

export function logout(refreshToken: string): Promise<ApiResult<void>> {
  return apiRequest<void>("/v1/logout", {
    method: "POST",
    cookie: refreshToken,
  });
}

export async function refresh(refreshToken: string): Promise<{
  result: ApiResult<AuthResponse>;
  newRefreshToken: string | null;
}> {
  const { result, setCookieHeader } = await apiRequestWithSetCookie<AuthResponse>(
    "/v1/refresh",
    { method: "POST", cookie: refreshToken },
  );
  return {
    result,
    newRefreshToken: extractCookieValue(setCookieHeader, REFRESH_COOKIE_NAME),
  };
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
