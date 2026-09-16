import "server-only";

import { apiRequest, type ApiResult } from "@/lib/api-client";

import type { Role, RolePermission } from "./types";

/**
 * Capa de servicios contra el servicio `servers` (via el gateway Kong) para
 * roles. Ver `features/servers/service.ts` para el resto de los endpoints de
 * `servers` y las notas generales sobre el back.
 *
 * Endpoints reales (ver servers/internal/handler):
 *   POST   /v1/servers/:id/roles                  -> 201 Role | 400 | 401 | 403 | 404
 *   GET    /v1/servers/:id/roles                  -> 200 [Role] | 401 | 404
 *   PATCH  /v1/roles/:id                          -> 200 Role | 400 | 401 | 403 | 404
 *   DELETE /v1/roles/:id                          -> 204 | 401 | 403 | 404 | 409 (rol default)
 *   PUT    /v1/servers/:id/default-role            -> 204 | 400 | 401 | 403 | 404
 *   POST   /v1/servers/:id/members/:userId/roles   -> 200 Role | 400 | 401 | 403 | 404
 *   DELETE /v1/servers/:id/members/:userId/roles/:roleId -> 204 | 401 | 403 | 404
 *   GET    /v1/servers/:id/members/:userId/roles   -> 200 [Role] | 401 | 404
 *
 * Nota sobre roles (ver servers/internal/service/role_service,
 * member_role_service): "tener permisos de administracion" en TODOS estos
 * endpoints hoy es literalmente "ser el owner del servidor"
 * (`service.RequireManageRoles`) -- el bitmask de permisos que guarda cada
 * rol no habilita ni restringe nada todavia. Tampoco hay endpoint que
 * exponga cual es el rol por defecto del servidor (`default_role_id` no
 * viaja en `ServerSummary`), asi que el front puede *fijar* el default pero
 * no puede mostrar de forma confiable cual es el actual.
 */

interface CreateRoleInput {
  name: string;
  color: string;
}

export function createRole(
  token: string,
  serverId: string,
  input: CreateRoleInput,
): Promise<ApiResult<Role>> {
  return apiRequest<Role>(`/v1/servers/${serverId}/roles`, {
    method: "POST",
    token,
    data: input,
  });
}

/** Todos los roles del server, ordenados por fecha de creacion (mas viejo primero). */
export function listRoles(
  token: string,
  serverId: string,
): Promise<ApiResult<Role[]>> {
  return apiRequest<Role[]>(`/v1/servers/${serverId}/roles`, {
    method: "GET",
    token,
  });
}

interface UpdateRoleInput {
  name?: string;
  color?: string;
  permissions?: RolePermission[];
}

/**
 * `permissions: undefined` deja los permisos actuales sin tocar; pasar `[]`
 * si se quiere vaciarlos. Mismo criterio para `name`/`color`.
 */
export function updateRole(
  token: string,
  roleId: string,
  input: UpdateRoleInput,
): Promise<ApiResult<Role>> {
  return apiRequest<Role>(`/v1/roles/${roleId}`, {
    method: "PATCH",
    token,
    data: input,
  });
}

/** 409 si `roleId` es el rol por defecto del servidor. */
export function deleteRole(
  token: string,
  roleId: string,
): Promise<ApiResult<void>> {
  return apiRequest<void>(`/v1/roles/${roleId}`, {
    method: "DELETE",
    token,
  });
}

export function setDefaultRole(
  token: string,
  serverId: string,
  roleId: string,
): Promise<ApiResult<void>> {
  return apiRequest<void>(`/v1/servers/${serverId}/default-role`, {
    method: "PUT",
    token,
    data: { role_id: roleId },
  });
}

export function assignRole(
  token: string,
  serverId: string,
  userId: string,
  roleId: string,
): Promise<ApiResult<Role>> {
  return apiRequest<Role>(`/v1/servers/${serverId}/members/${userId}/roles`, {
    method: "POST",
    token,
    data: { role_id: roleId },
  });
}

/** Idempotente del lado del back? No -- 404 si el miembro no tenia ese rol. */
export function removeRole(
  token: string,
  serverId: string,
  userId: string,
  roleId: string,
): Promise<ApiResult<void>> {
  return apiRequest<void>(
    `/v1/servers/${serverId}/members/${userId}/roles/${roleId}`,
    { method: "DELETE", token },
  );
}

export function listMemberRoles(
  token: string,
  serverId: string,
  userId: string,
): Promise<ApiResult<Role[]>> {
  return apiRequest<Role[]>(`/v1/servers/${serverId}/members/${userId}/roles`, {
    method: "GET",
    token,
  });
}
