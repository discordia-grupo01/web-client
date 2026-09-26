import {
  type TwoFactorRecoveryCodesPayload,
  type TwoFactorSetup,
  type TwoFactorStatus,
  type TwoFactorVerifyPayload,
} from "@discordia/client-shared";

import "server-only";

import {
  apiRequest,
  apiRequestWithSetCookie,
  type ApiResult,
} from "@/lib/api-client";
import { extractCookieValue } from "@/lib/set-cookie";

const REFRESH_COOKIE_NAME = "refresh_token";

/**
 * Capa de servicios del segundo factor contra identify-service.
 *
 * Endpoints reales (ver identify-service/openapi.yaml):
 *   GET   /v1/me/2fa                 -> 200 TwoFactorStatus
 *   POST  /v1/me/2fa/setup           -> 200 { secret, otpauth_url, ... } | 409 TWO_FACTOR_ALREADY_ENABLED
 *   POST  /v1/me/2fa/activate        -> 200 { recovery_codes } | 400 INVALID_TWO_FACTOR_CODE | 409 TWO_FACTOR_SETUP_MISSING
 *   POST  /v1/me/2fa/disable         -> 204 | 403 INVALID_PASSWORD | 409 TWO_FACTOR_NOT_ENABLED
 *   POST  /v1/me/2fa/recovery-codes  -> 200 { recovery_codes } | 403 INVALID_PASSWORD
 *   POST  /v1/login/2fa              -> 200 { user, token, ... } + Set-Cookie refresh_token
 *                                       | 401 INVALID_TWO_FACTOR_CODE / TWO_FACTOR_CHALLENGE_EXPIRED
 *                                       | 429 TWO_FACTOR_TOO_MANY_ATTEMPTS
 *
 * `verifyTwoFactorLogin` es el unico publico: se llama justamente cuando
 * todavia no hay sesion, asi que no manda Bearer.
 */

export function getTwoFactorStatus(
  token: string,
): Promise<ApiResult<TwoFactorStatus>> {
  return apiRequest<TwoFactorStatus>("/v1/me/2fa", { method: "GET", token });
}

export function startTwoFactorSetup(
  token: string,
): Promise<ApiResult<TwoFactorSetup>> {
  return apiRequest<TwoFactorSetup>("/v1/me/2fa/setup", {
    method: "POST",
    token,
  });
}

export function activateTwoFactor(
  token: string,
  code: string,
): Promise<ApiResult<TwoFactorRecoveryCodesPayload>> {
  return apiRequest<TwoFactorRecoveryCodesPayload>("/v1/me/2fa/activate", {
    method: "POST",
    token,
    data: { code },
  });
}

export function disableTwoFactor(
  token: string,
  password: string,
): Promise<ApiResult<void>> {
  return apiRequest<void>("/v1/me/2fa/disable", {
    method: "POST",
    token,
    data: { password },
  });
}

export function regenerateRecoveryCodes(
  token: string,
  password: string,
): Promise<ApiResult<TwoFactorRecoveryCodesPayload>> {
  return apiRequest<TwoFactorRecoveryCodesPayload>(
    "/v1/me/2fa/recovery-codes",
    { method: "POST", token, data: { password } },
  );
}

/**
 * Segundo paso del login. Devuelve el refresh token igual que `login()`,
 * sacado del header Set-Cookie: es el momento en que la sesion recien existe.
 */
export async function verifyTwoFactorLogin(data: {
  challenge_token: string;
  code: string;
}): Promise<{
  result: ApiResult<TwoFactorVerifyPayload>;
  refreshToken: string | null;
}> {
  const { result, setCookieHeader } =
    await apiRequestWithSetCookie<TwoFactorVerifyPayload>("/v1/login/2fa", {
      method: "POST",
      data,
    });
  return {
    result,
    refreshToken: extractCookieValue(setCookieHeader, REFRESH_COOKIE_NAME),
  };
}
