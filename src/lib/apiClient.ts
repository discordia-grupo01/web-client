import "server-only";

import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import {
  isAccountSuspended,
  networkFailure,
  NETWORK_ERROR_MESSAGE,
  TIMEOUT_ERROR_MESSAGE,
  toApiResult,
  type ApiFailure,
  type ApiResult,
} from "@discordia/client-shared";

import { cookies } from "next/headers";

import { ACCOUNT_SUSPENDED_COOKIE } from "./constants";
import { env } from "./env";

export type { ApiResult };

const http = axios.create({
  baseURL: env.apiUrl,
  headers: { "Content-Type": "application/json" },
  timeout: 10_000,
  validateStatus: () => true,
});

interface RequestOptions extends Omit<AxiosRequestConfig, "url" | "data"> {
  token?: string;
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

const SUSPENSION_EXEMPT_PATHS = new Set([
  "/v1/login",
  "/v1/login/2fa",
  "/v1/pin/login",
  "/v1/oauth/google",
  "/v1/logout",
]);

function toResult<T>(
  path: string,
  status: number,
  body: unknown,
): ApiResult<T> {
  const result = toApiResult<T>(status, body);
  if (
    !result.ok &&
    !SUSPENSION_EXEMPT_PATHS.has(path) &&
    isAccountSuspended(result)
  ) {
    try {
      cookies().set(ACCOUNT_SUSPENDED_COOKIE, "1", {
        sameSite: "lax",
        path: "/",
      });
    } catch {
      // Desde un Server Component no se pueden escribir cookies; la proxima
      // request que pase por un Route Handler deja la marca.
    }
  }
  return result;
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
    return toResult<T>(path, response.status, response.data);
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
      result: toResult<T>(path, response.status, response.data),
      setCookieHeader: response.headers["set-cookie"],
    };
  } catch (error) {
    return { result: toNetworkError(error), setCookieHeader: undefined };
  }
}

/**
 * Como `apiRequest`, pero ademas devuelve el body crudo. Lo necesita voz:
 * signaling manda los errores como `{ error: "voice_forbidden" }` y no con la
 * forma de los otros servicios, asi que `toApiResult` pierde el codigo.
 */
export async function apiRequestWithBody<T>(
  path: string,
  options: RequestOptions = {},
): Promise<{ result: ApiResult<T>; body: unknown }> {
  try {
    const response = await http.request<unknown>({
      url: path,
      ...buildRequestConfig(options),
    });
    return {
      result: toResult<T>(path, response.status, response.data),
      body: response.data,
    };
  } catch (error) {
    return { result: toNetworkError(error), body: undefined };
  }
}
