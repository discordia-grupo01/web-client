import "server-only";

import { apiRequest, type ApiResult } from "@/lib/api-client";
import { env } from "@/lib/env";

import type {
  Category,
  Channel,
  Invitation,
  Member,
  Role,
  RolePermission,
  ServerSummary,
  ServersApiErrorBody,
} from "./types";

/**
 * Capa de servicios contra el servicio `servers` (via el gateway Kong).
 *
 * Endpoints reales (ver servers/internal/handler):
 *   GET    /v1/servers                          -> 200 [Server] | 401
 *   GET    /v1/servers/:id                      -> 200 Server | 400 | 404
 *   POST   /v1/servers                           -> 201 Server | 400 | 401 | 409 (nombre repetido)
 *   POST   /v1/servers/:id/channels               -> 201 Channel | 400 | 401 | 403 | 404
 *   PATCH  /v1/channels/:id                       -> 200 Channel | 400 | 401 | 403 | 404
 *   DELETE /v1/channels/:id                       -> 204 | 401 | 403 | 404
 *   PATCH  /v1/channels/:id/category               -> 200 Channel | 400 | 401 | 403 | 404
 *   POST   /v1/servers/:id/categories              -> 201 Category | 400 | 401 | 403 | 404
 *   PATCH  /v1/categories/:id                     -> 200 Category | 400 | 401 | 403 | 404
 *   PATCH  /v1/servers/:id/channels/reorder        -> 200 | 400 | 401 | 403 | 404
 *   GET    /v1/servers/:id/members               -> 200 { members, total, limit, offset } | 401
 *   POST   /v1/servers/:id/invites                -> 201 Invitation | 400 | 401 | 403 | 404
 *   GET    /v1/servers/:id/invites                -> 200 [Invitation] | 401 | 403 | 404
 *   DELETE /v1/invites/:code                       -> 204 (idempotente) | 401 | 403
 *   POST   /v1/invites/:code/join                -> 200|201 { server_id, already_member } | 403 | 404
 *   DELETE /v1/servers/:id/members/:userId       -> 204 | 401 | 403 | 404 | 409 (owner)
 *   POST   /v1/servers/:id/roles                  -> 201 Role | 400 | 401 | 403 | 404
 *   GET    /v1/servers/:id/roles                  -> 200 [Role] | 401 | 404
 *   PATCH  /v1/roles/:id                          -> 200 Role | 400 | 401 | 403 | 404
 *   DELETE /v1/roles/:id                          -> 204 | 401 | 403 | 404 | 409 (rol default)
 *   PUT    /v1/servers/:id/default-role            -> 204 | 400 | 401 | 403 | 404
 *   POST   /v1/servers/:id/members/:userId/roles   -> 200 Role | 400 | 401 | 403 | 404
 *   DELETE /v1/servers/:id/members/:userId/roles/:roleId -> 204 | 401 | 403 | 404
 *   GET    /v1/servers/:id/members/:userId/roles   -> 200 [Role] | 401 | 404
 *
 * Todavia NO existen: editar/borrar servidor,
 * preview de una invitacion sin unirse. resolver user_id -> nombre ya no vive
 * aca: es `getPublicProfile` en `features/auth/service.ts`, contra
 * identify-service. Ver la referencia de la API para transferencia de
 * ownership.
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

export function listMyServers(
  token: string,
): Promise<ApiResult<ServerSummary[]>> {
  return apiRequest<ServerSummary[]>("/v1/servers", {
    method: "GET",
    token,
  });
}

interface CreateChannelInput {
  name: string;
  kind: "text" | "voice";
  categoryId?: string;
}

export function createChannel(
  token: string,
  serverId: string,
  input: CreateChannelInput,
): Promise<ApiResult<Channel>> {
  return apiRequest<Channel>(`/v1/servers/${serverId}/channels`, {
    method: "POST",
    token,
    data: {
      name: input.name,
      kind: input.kind,
      ...(input.categoryId ? { category_id: input.categoryId } : {}),
    },
  });
}

interface UpdateChannelInput {
  name: string;
}

export function updateChannel(
  token: string,
  channelId: string,
  input: UpdateChannelInput,
): Promise<ApiResult<Channel>> {
  return apiRequest<Channel>(`/v1/channels/${channelId}`, {
    method: "PATCH",
    token,
    data: input,
  });
}

export function deleteChannel(
  token: string,
  channelId: string,
): Promise<ApiResult<void>> {
  return apiRequest<void>(`/v1/channels/${channelId}`, {
    method: "DELETE",
    token,
  });
}

/** `categoryId: null` mueve el canal a "sin categoria". */
export function moveChannelToCategory(
  token: string,
  channelId: string,
  categoryId: string | null,
): Promise<ApiResult<Channel>> {
  return apiRequest<Channel>(`/v1/channels/${channelId}/category`, {
    method: "PATCH",
    token,
    data: { category_id: categoryId },
  });
}

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

/**
 * `categoryId: null` reordena el balde "sin categoria" de ese servidor.
 * `channelIds` tiene que ser exactamente el set de canales que el back tiene
 * hoy en esa categoria (mismo largo, mismos ids): el back lo valida y
 * devuelve 400 `reorder_invalid` si no matchea.
 */
export function reorderChannels(
  token: string,
  serverId: string,
  categoryId: string | null,
  channelIds: string[],
): Promise<ApiResult<void>> {
  return apiRequest<void>(`/v1/servers/${serverId}/channels/reorder`, {
    method: "PATCH",
    token,
    data: { category_id: categoryId, channel_ids: channelIds },
  });
}

export function getServer(
  token: string,
  serverId: string,
): Promise<ApiResult<ServerSummary>> {
  return apiRequest<ServerSummary>(`/v1/servers/${serverId}`, {
    method: "GET",
    token,
  });
}

/**
 * Solo self-leave: el backend rechaza con 403 si `userId` no es el del
 * caller (no hay endpoint de "kick" en esta ruta), y con 409 si el caller
 * es el owner del servidor (tiene que transferir la propiedad o borrarlo).
 */
export function leaveServer(
  token: string,
  serverId: string,
  userId: string,
): Promise<ApiResult<void>> {
  return apiRequest<void>(`/v1/servers/${serverId}/members/${userId}`, {
    method: "DELETE",
    token,
  });
}

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

interface MemberListResult {
  members: Member[];
  total: number;
  limit: number;
  offset: number;
}

/** Trae hasta 100 miembros (el maximo que acepta el back) en una sola pagina. */
export function listMembers(
  token: string,
  serverId: string,
): Promise<ApiResult<MemberListResult>> {
  return apiRequest<MemberListResult>(
    `/v1/servers/${serverId}/members?limit=100`,
    { method: "GET", token },
  );
}

/**
 * Cualquier miembro del server puede generar/revocar invitaciones (no es
 * owner-only): el back solo chequea membresia, ver
 * internal/service/invitation/service.go.
 */
export function generateInvitation(
  token: string,
  serverId: string,
  maxUses?: number,
): Promise<ApiResult<Invitation>> {
  return apiRequest<Invitation>(`/v1/servers/${serverId}/invites`, {
    method: "POST",
    token,
    data: maxUses !== undefined ? { max_uses: maxUses } : {},
  });
}

/** Cualquier miembro puede ver todas las invitaciones del server (mismo chequeo que generar/revocar). */
export function listInvitations(
  token: string,
  serverId: string,
): Promise<ApiResult<Invitation[]>> {
  return apiRequest<Invitation[]>(`/v1/servers/${serverId}/invites`, {
    method: "GET",
    token,
  });
}

/** Idempotente: revocar un codigo ya revocado igual devuelve 204. */
export function revokeInvitation(
  token: string,
  code: string,
): Promise<ApiResult<void>> {
  return apiRequest<void>(`/v1/invites/${encodeURIComponent(code)}`, {
    method: "DELETE",
    token,
  });
}

interface JoinResult {
  server_id: string;
  already_member: boolean;
}

/**
 * El backend no tiene un endpoint de "preview" de una invitacion: este
 * join es de un solo paso (a diferencia del flujo de 2 pasos del prototipo
 * de Figma, que no tiene con que hablar del lado del back todavia).
 */
export function joinServerByCode(
  token: string,
  code: string,
): Promise<ApiResult<JoinResult>> {
  return apiRequest<JoinResult>(
    `/v1/invites/${encodeURIComponent(code)}/join`,
    {
      method: "POST",
      token,
    },
  );
}

interface ServerIconSuccess {
  ok: true;
  status: number;
  body: ReadableStream<Uint8Array>;
  contentType: string;
}
interface ServerIconFailure {
  ok: false;
  status: number;
}
export type ServerIconResult = ServerIconSuccess | ServerIconFailure;

/**
 * `GET /v1/servers/:id/icon` exige JWT (via el plugin jwt de Kong), y un
 * `<img src="...">` del navegador no puede mandar el header Authorization
 * -- por eso esto vive del lado server y usa fetch nativo en vez de
 * `apiRequest` (pensada para JSON): devolvemos el binario tal cual, sin
 * parsear.
 */
export async function getServerIcon(
  token: string,
  serverId: string,
): Promise<ServerIconResult> {
  const response = await fetch(`${env.apiUrl}/v1/servers/${serverId}/icon`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok || !response.body) {
    return { ok: false, status: response.status || 502 };
  }

  return {
    ok: true,
    status: response.status,
    body: response.body,
    contentType: response.headers.get("content-type") ?? "image/png",
  };
}

interface ServersServiceSuccess<T> {
  ok: true;
  status: number;
  data: T;
}
interface ServersServiceFailure {
  ok: false;
  status: number;
  message: string;
  details?: Record<string, unknown>;
}
export type ServersServiceResult<T> =
  ServersServiceSuccess<T> | ServersServiceFailure;

/**
 * `POST /v1/servers` es multipart/form-data (name + icon opcional). Usamos
 * fetch nativo en vez de la instancia axios de lib/api-client.ts (pensada
 * para JSON): asi Node arma el boundary del FormData sin ambiguedad.
 */
export async function createServer(
  token: string,
  formData: FormData,
): Promise<ServersServiceResult<ServerSummary>> {
  try {
    const response = await fetch(`${env.apiUrl}/v1/servers`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const body = await response.json().catch(() => undefined);

    if (response.ok) {
      return {
        ok: true,
        status: response.status,
        data: body as ServerSummary,
      };
    }

    const err = body as ServersApiErrorBody | undefined;
    return {
      ok: false,
      status: response.status,
      message: err?.error?.message ?? "Ocurrio un error inesperado.",
      details: err?.error?.details,
    };
  } catch {
    return {
      ok: false,
      status: 0,
      message:
        "No pudimos conectar con el servidor. Intenta de nuevo en un momento.",
    };
  }
}
