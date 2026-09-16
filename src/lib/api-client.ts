import "server-only";

import axios, { AxiosError, type AxiosRequestConfig } from "axios";

import { env } from "./env";

/** Forma de error del backend: `{ error: { code, message, details? } }`. */
interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

interface ApiSuccess<T> {
  ok: true;
  status: number;
  data: T;
}

interface ApiFailure {
  ok: false;
  status: number;
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

/**
 * Instancia de axios hacia identify-service. Solo corre en el servidor: el
 * navegador pega contra los Route Handlers de `/api/*`, que usan este cliente.
 */
const http = axios.create({
  baseURL: env.apiUrl,
  headers: { "Content-Type": "application/json" },
  timeout: 10_000,
  // No lanzar por status: mapeamos todo a ApiResult mas abajo.
  validateStatus: () => true,
});

interface RequestOptions extends Omit<AxiosRequestConfig, "url" | "data"> {
  /** Token para el header `Authorization: Bearer`. */
  token?: string;
  data?: unknown;
}

export async function apiRequest<T>(
  path: string,
  { token, headers, ...config }: RequestOptions = {},
): Promise<ApiResult<T>> {
  try {
    const response = await http.request<T | ApiErrorBody>({
      url: path,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      ...config,
    });

    if (response.status >= 200 && response.status < 300) {
      return { ok: true, status: response.status, data: response.data as T };
    }

    const body = response.data as ApiErrorBody | undefined;
    return {
      ok: false,
      status: response.status,
      code: body?.error?.code ?? "UNKNOWN_ERROR",
      message:
        body?.error?.message ??
        "Ocurrio un error inesperado. Intenta de nuevo.",
      details: body?.error?.details,
    };
  } catch (error) {
    const message =
      error instanceof AxiosError && error.code === "ECONNABORTED"
        ? "El servidor tardo demasiado en responder. Intenta de nuevo."
        : "No pudimos conectar con el servidor. Intenta de nuevo en un momento.";
    return { ok: false, status: 0, code: "NETWORK_ERROR", message };
  }
}
