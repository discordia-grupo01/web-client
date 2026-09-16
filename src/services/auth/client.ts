import { api } from "@/lib/browser-api-client";

import type {
  ForgotPasswordActionResult,
  GetOwnProfileActionResult,
  GetPublicProfileActionResult,
  LoginActionResult,
  RegisterActionResult,
  ResetPasswordActionResult,
  UpdateOwnProfileActionResult,
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

export async function getPublicProfileRequest(
  userId: string,
): Promise<GetPublicProfileActionResult> {
  try {
    const { data } = await api.get<GetPublicProfileActionResult>(
      `/users/${userId}`,
    );
    return data;
  } catch {
    return {
      ok: false,
      message: "No pudimos cargar el perfil.",
    };
  }
}

export async function getOwnProfileRequest(): Promise<GetOwnProfileActionResult> {
  try {
    const { data } = await api.get<GetOwnProfileActionResult>("/profile");
    return data;
  } catch {
    return {
      ok: false,
      message: "No pudimos cargar tu perfil.",
    };
  }
}

/**
 * `formData` va tal cual (multipart/form-data): le sacamos el
 * `Content-Type: application/json` que trae la instancia por default, igual
 * que `createServerRequest` en services/servers/client.ts.
 */
export async function updateOwnProfileRequest(
  formData: FormData,
): Promise<UpdateOwnProfileActionResult> {
  try {
    const { data } = await api.patch<UpdateOwnProfileActionResult>(
      "/profile",
      formData,
      { headers: { "Content-Type": undefined } },
    );
    return data;
  } catch {
    return {
      ok: false,
      message: "No pudimos actualizar tu perfil. Intenta de nuevo.",
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
