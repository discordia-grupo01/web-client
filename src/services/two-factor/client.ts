import {
  REQUEST_FAILED_MESSAGE,
  type TwoFactorDisableResult,
  type TwoFactorRecoveryCodesResult,
  type TwoFactorSetupResult,
  type TwoFactorStatusResult,
  type TwoFactorVerifyResult,
} from "@discordia/client-shared";

import { api } from "@/lib/browser-api-client";

export async function twoFactorStatusRequest(): Promise<TwoFactorStatusResult> {
  try {
    const { data } = await api.get<TwoFactorStatusResult>("/2fa");
    return data;
  } catch {
    return { ok: false, message: REQUEST_FAILED_MESSAGE };
  }
}

export async function twoFactorSetupRequest(): Promise<TwoFactorSetupResult> {
  try {
    const { data } = await api.post<TwoFactorSetupResult>("/2fa/setup");
    return data;
  } catch {
    return { ok: false, message: REQUEST_FAILED_MESSAGE };
  }
}

export async function twoFactorActivateRequest(
  code: string,
): Promise<TwoFactorRecoveryCodesResult> {
  try {
    const { data } = await api.post<TwoFactorRecoveryCodesResult>(
      "/2fa/activate",
      { code },
    );
    return data;
  } catch {
    return { ok: false, message: REQUEST_FAILED_MESSAGE };
  }
}

export async function twoFactorDisableRequest(
  password: string,
): Promise<TwoFactorDisableResult> {
  try {
    const { data } = await api.post<TwoFactorDisableResult>("/2fa/disable", {
      password,
    });
    return data;
  } catch {
    return { ok: false, message: REQUEST_FAILED_MESSAGE };
  }
}

export async function twoFactorRegenerateCodesRequest(
  password: string,
): Promise<TwoFactorRecoveryCodesResult> {
  try {
    const { data } = await api.post<TwoFactorRecoveryCodesResult>(
      "/2fa/recovery-codes",
      { password },
    );
    return data;
  } catch {
    return { ok: false, message: REQUEST_FAILED_MESSAGE };
  }
}

/** Segundo paso del login. */
export async function twoFactorVerifyRequest(
  code: string,
): Promise<TwoFactorVerifyResult> {
  try {
    const { data } = await api.post<TwoFactorVerifyResult>("/auth/2fa/verify", {
      code,
    });
    return data;
  } catch {
    return { ok: false, message: REQUEST_FAILED_MESSAGE };
  }
}
