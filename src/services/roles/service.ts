import { type Role, type RolePermission } from "@discordia/client-shared";

import "server-only";

import { apiRequest, type ApiResult } from "@/lib/apiClient";

/**
 * Capa de servicios contra el servicio `servers` (via el gateway Kong) para
 * roles. Ver `services/servers/service.ts` para el resto de los endpoints de
 * `servers` y las notas generales sobre el back.
 *
 * Endpoints reales (ver servers/internal/handler):
 *   POST   /v1/servers/:id/roles                  -> 201 Role | 400 | 401 | 403 | 404
 *   GET    /v1/servers/:id/roles                  -> 200 [Role] | 401 | 404
 *   PATCH  /v1/roles/:id                          -> 200 Role | 400 | 401 | 403 | 404
 *   DELETE /v1/roles/:id                          -> 204 | 401 | 403 | 404 | 409 (rol default)
 *   PATCH  /v1/servers/:id/roles/reorder           -> 200 [Role] | 400 | 401 | 403 | 404
 *   PUT    /v1/servers/:id/default-role            -> 204 | 400 | 401 | 403 | 404
 *   POST   /v1/servers/:id/members/:userId/roles   -> 200 Role | 400 | 401 | 403 | 404
 *   DELETE /v1/servers/:id/members/:userId/roles/:roleId -> 204 | 401 | 403 | 404
 *   GET    /v1/servers/:id/members/:userId/roles   -> 200 [Role] | 401 | 404
 *
 * Nota sobre roles (ver servers/internal/service/role_service,
 * member_role_service): estos endpoints exigen `service.RequireManageRoles`,
 * que hoy ya mira el bitmask de permisos efectivo del actor (el owner sigue
 * pudiendo todo, pero cualquier miembro con `MANAGE_ROLES` via algun rol
 * tambien) -- no es "ser el owner" a secas. Tampoco hay endpoint que exponga
 * cual es el rol por defecto del servidor (`default_role_id` no viaja en
 * `ServerSummary`), asi que el front puede *fijar* el default pero no puede
 * mostrar de forma confiable cual es el actual.
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

export function reorderRoles(
  token: string,
  serverId: string,
  roleIds: string[],
): Promise<ApiResult<Role[]>> {
  return apiRequest<Role[]>(`/v1/servers/${serverId}/roles/reorder`, {
    method: "PATCH",
    token,
    data: { role_ids: roleIds },
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
