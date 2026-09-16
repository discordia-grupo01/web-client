import { api } from "@/lib/browser-api-client";

import type {
  ForgotPasswordActionResult,
  LoginActionResult,
  RegisterActionResult,
  ResetPasswordActionResult,
} from "./types";
import type {
  ForgotPasswordValues,
  LoginValues,
  RegisterValues,
} from "./validation";

/**
 * Llamadas del navegador hacia el BFF (`/api/auth/*`, mismo origen).
 * Nunca pega directo a identify-service.
 */

export async function loginRequest(
  credentials: LoginValues,
): Promise<LoginActionResult> {
  try {
    const { data } = await api.post<LoginActionResult>(
      "/auth/login",
      credentials,
    );
    return data;
  } catch {
    return {
      ok: false,
      message: "No pudimos procesar la solicitud. Intenta de nuevo.",
    };
  }
}

export async function registerRequest(
  values: RegisterValues,
): Promise<RegisterActionResult> {
  try {
    const { data } = await api.post<RegisterActionResult>(
      "/auth/register",
      values,
    );
    return data;
  } catch {
    return {
      ok: false,
      message: "No pudimos procesar la solicitud. Intenta de nuevo.",
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
): Promise<ForgotPasswordActionResult> {
  try {
    const { data } = await api.post<ForgotPasswordActionResult>(
      "/auth/forgot-password",
      values,
    );
    return data;
  } catch {
    return {
      ok: false,
      message: "No pudimos procesar la solicitud. Intenta de nuevo.",
    };
  }
}

export async function resetPasswordRequest(values: {
  token: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<ResetPasswordActionResult> {
  try {
    const { data } = await api.post<ResetPasswordActionResult>(
      "/auth/reset-password",
      values,
    );
    return data;
  } catch {
    return {
      ok: false,
      message: "No pudimos procesar la solicitud. Intenta de nuevo.",
    };
  }
}
