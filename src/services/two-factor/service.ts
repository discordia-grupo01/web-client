import {
  type AccountRecoveryCreatePayload,
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
} from "@/lib/apiClient";
import { extractCookieValue } from "@/lib/setCookie";

const REFRESH_COOKIE_NAME = "refresh_token";

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

export function requestAccountRecovery(data: {
  challenge_token: string;
  message: string;
}): Promise<ApiResult<AccountRecoveryCreatePayload>> {
  return apiRequest<AccountRecoveryCreatePayload>(
    "/v1/login/2fa/recovery-request",
    { method: "POST", data },
  );
}
