import "server-only";

import { apiRequest, type ApiResult } from "@/lib/api-client";

import type { AuthResponse } from "./types";

/**
 * Capa de servicios contra identify-service.
 *
 * Endpoints reales (ver identify-service/openapi.yaml):
 *   POST /v1/login   -> 200 { user, token } | 400 | 401 INVALID_CREDENTIALS
 *   POST /v1/logout  -> 204 (Bearer) | 401 SESSION_EXPIRED
 *
 * Todavia NO existen en el backend: refresh, password/forgot, password/reset,
 * oauth/{provider}, 2fa/*, pin/*. Cuando aparezcan se agregan aca.
 */

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
