import "server-only";

import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import {
  networkFailure,
  NETWORK_ERROR_MESSAGE,
  TIMEOUT_ERROR_MESSAGE,
  toApiResult,
  type ApiFailure,
  type ApiResult,
} from "@discordia/client-shared";

import { env } from "./env";

export type { ApiResult };

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

/** Axios solo distingue el timeout con `ECONNABORTED`; `fetch` no lo expone. */
function toNetworkError(error: unknown): ApiFailure {
  return networkFailure(
    error instanceof AxiosError && error.code === "ECONNABORTED"
      ? TIMEOUT_ERROR_MESSAGE
      : NETWORK_ERROR_MESSAGE,
  );
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiResult<T>> {
  try {
    const response = await http.request<unknown>({
      url: path,
      ...buildRequestConfig(options),
    });
    return toApiResult<T>(response.status, response.data);
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
    const response = await http.request<unknown>({
      url: path,
      ...buildRequestConfig(options),
    });
    return {
      result: toApiResult<T>(response.status, response.data),
      setCookieHeader: response.headers["set-cookie"],
    };
  } catch (error) {
    return { result: toNetworkError(error), setCookieHeader: undefined };
  }
}
