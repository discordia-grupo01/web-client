import {
  type ForgotPasswordResult,
  type ForgotPasswordValues,
  type LoginResult,
  type LoginValues,
  type RegisterResult,
  type RegisterValues,
  REQUEST_FAILED_MESSAGE,
  type ResetPasswordResult,
} from "@discordia/client-shared";

import { api } from "@/lib/browser-api-client";

/**
 * Llamadas del navegador hacia el BFF (`/api/auth/*`, mismo origen).
 * Nunca pega directo a identify-service.
 */

export async function loginRequest(
  credentials: LoginValues,
): Promise<LoginResult> {
  try {
    const { data } = await api.post<LoginResult>("/auth/login", credentials);
    return data;
  } catch {
    return {
      ok: false,
      message: REQUEST_FAILED_MESSAGE,
    };
  }
}

export async function oauthGoogleLoginRequest(
  idToken: string,
): Promise<LoginResult> {
  try {
    const { data } = await api.post<LoginResult>("/auth/oauth/google", {
      idToken,
    });
    return data;
  } catch {
    return {
      ok: false,
      message: REQUEST_FAILED_MESSAGE,
    };
  }
}

export async function registerRequest(
  values: RegisterValues,
): Promise<RegisterResult> {
  try {
    const { data } = await api.post<RegisterResult>("/auth/register", values);
    return data;
  } catch {
    return {
      ok: false,
      message: REQUEST_FAILED_MESSAGE,
    };
  }
}

export async function logoutRequest(): Promise<void> {
  try {
    await api.post("/auth/logout");
  } catch {
    // El logout es best effort desde el cliente; la cookie se limpia igual.
  }
}

export async function forgotPasswordRequest(
  values: ForgotPasswordValues,
): Promise<ForgotPasswordResult> {
  try {
    const { data } = await api.post<ForgotPasswordResult>(
      "/auth/forgot-password",
      values,
    );
    return data;
  } catch {
    return {
      ok: false,
      message: REQUEST_FAILED_MESSAGE,
    };
  }
}

export async function resetPasswordRequest(values: {
  token: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<ResetPasswordResult> {
  try {
    const { data } = await api.post<ResetPasswordResult>(
      "/auth/reset-password",
      values,
    );
    return data;
  } catch {
    return {
      ok: false,
      message: REQUEST_FAILED_MESSAGE,
    };
  }
}
