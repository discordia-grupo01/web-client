import axios from "axios";

import type { LoginActionResult } from "./types";
import type { LoginValues } from "./validation";

/**
 * Llamadas del navegador hacia el BFF (`/api/auth/*`, mismo origen).
 * Nunca pega directo a identify-service.
 */
const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
  validateStatus: () => true,
});

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

export async function logoutRequest(): Promise<void> {
  try {
    await api.post("/auth/logout");
  } catch {
    // El logout es best effort desde el cliente; la cookie se limpia igual.
  }
}
