import "server-only";

import { apiRequest, type ApiResult } from "@/lib/api-client";

import type { Category } from "@/types/category.types";

/**
 * Capa de servicios contra el servicio `servers` (via el gateway Kong) para
 * categorias. Ver `services/servers/service.ts` para el resto de los
 * endpoints de `servers` y las notas generales sobre el back.
 *
 * Endpoints reales (ver servers/internal/handler):
 *   POST   /v1/servers/:id/categories              -> 201 Category | 400 | 401 | 403 | 404
 *   PATCH  /v1/categories/:id                     -> 200 Category | 400 | 401 | 403 | 404
 */

export function createCategory(
  token: string,
  serverId: string,
  name: string,
): Promise<ApiResult<Category>> {
  return apiRequest<Category>(`/v1/servers/${serverId}/categories`, {
    method: "POST",
    token,
    data: { name },
  });
}

export function updateCategory(
  token: string,
  categoryId: string,
  name: string,
): Promise<ApiResult<Category>> {
  return apiRequest<Category>(`/v1/categories/${categoryId}`, {
    method: "PATCH",
    token,
    data: { name },
  });
}
