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
  /** Valor del refresh token para el header `Cookie: refresh_token=<valor>`. */
  cookie?: string;
  data?: unknown;
}

function buildRequestConfig({
  token,
  cookie,
  headers,
  ...config
}: RequestOptions): AxiosRequestConfig {
  return {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(cookie ? { Cookie: `refresh_token=${cookie}` } : {}),
      ...headers,
    },
    ...config,
  };
}

function toApiResult<T>(response: {
  status: number;
  data: T | ApiErrorBody;
}): ApiResult<T> {
  if (response.status >= 200 && response.status < 300) {
    return { ok: true, status: response.status, data: response.data as T };
  }

  const body = response.data as ApiErrorBody | undefined;
  return {
    ok: false,
    status: response.status,
    code: body?.error?.code ?? "UNKNOWN_ERROR",
    message:
      body?.error?.message ?? "Ocurrio un error inesperado. Intenta de nuevo.",
    details: body?.error?.details,
  };
}

function toNetworkError(error: unknown): ApiFailure {
  const message =
    error instanceof AxiosError && error.code === "ECONNABORTED"
      ? "El servidor tardo demasiado en responder. Intenta de nuevo."
      : "No pudimos conectar con el servidor. Intenta de nuevo en un momento.";
  return { ok: false, status: 0, code: "NETWORK_ERROR", message };
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiResult<T>> {
  try {
    const response = await http.request<T | ApiErrorBody>({
      url: path,
      ...buildRequestConfig(options),
    });
    return toApiResult<T>(response);
  } catch (error) {
    return toNetworkError(error);
  }
}

/**
 * Como `apiRequest`, pero ademas expone el header `Set-Cookie` crudo de la
 * respuesta. Solo lo necesitan login y refresh, que tienen que capturar el
 * `refresh_token` que pone identify-service.
 */
export async function apiRequestWithSetCookie<T>(
  path: string,
  options: RequestOptions = {},
): Promise<{ result: ApiResult<T>; setCookieHeader: string[] | undefined }> {
  try {
    const response = await http.request<T | ApiErrorBody>({
      url: path,
      ...buildRequestConfig(options),
    });
    return {
      result: toApiResult<T>(response),
      setCookieHeader: response.headers["set-cookie"],
    };
  } catch (error) {
    return { result: toNetworkError(error), setCookieHeader: undefined };
  }
}
