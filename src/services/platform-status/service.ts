import type { PlatformStatusResponse } from "@discordia/client-shared";

import "server-only";

import { apiRequest, type ApiResult } from "@/lib/apiClient";

/**
 * Estado de la plataforma, contra `metrics` (via el gateway Kong).
 *
 *   GET /v1/status -> 200 { status, incidents } | 401
 *
 * Se consulta una vez al cargar la app: el back no avisa en vivo cuando se
 * publica o se resuelve un incidente.
 */
export function getPlatformStatus(
  token: string,
): Promise<ApiResult<PlatformStatusResponse>> {
  return apiRequest<PlatformStatusResponse>("/v1/status", { token });
}
