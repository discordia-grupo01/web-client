/**
 * Catálogo cerrado de permisos que puede tener un rol (ver
 * `servers/internal/model/role/permission.go`). El back no expone ningún
 * permiso "administrador" -- este es el set completo, no un subconjunto.
 */
export const ROLE_PERMISSIONS = [
  "VIEW_CHANNELS",
  "SEND_MESSAGES",
  "MANAGE_CHANNELS",
  "MANAGE_ROLES",
  "KICK_MEMBERS",
  "BAN_MEMBERS",
  "MANAGE_SERVER",
] as const;

export type RolePermission = (typeof ROLE_PERMISSIONS)[number];

/** Rol tal como lo devuelve `servers` (create/list/update, embebido o no). */
export interface Role {
  id: string;
  server_id: string;
  name: string;
  color: string;
  permissions: RolePermission[];
  created_at: string;
  updated_at: string;
}

export interface RoleFieldErrors {
  name?: string;
  color?: string;
  permissions?: string;
}

/** Resultado de `POST /api/servers/:id/roles`. */
export type CreateRoleActionResult =
  | { ok: true; role: Role }
  | { ok: false; message: string; fieldErrors?: RoleFieldErrors };

/** Resultado de `GET /api/servers/:id/roles`. */
export type ListRolesActionResult =
  { ok: true; roles: Role[] } | { ok: false; message: string };

/** Resultado de `PATCH /api/roles/:id`. */
export type UpdateRoleActionResult =
  | { ok: true; role: Role }
  | { ok: false; message: string; fieldErrors?: RoleFieldErrors };

/**
 * Resultado de `DELETE /api/roles/:id`. El back rechaza con 409 si el rol es
 * el rol por defecto del servidor (`isDefaultRole: true` en ese caso) -- hay
 * que asignar otro rol por defecto antes de poder borrar este.
 */
export type DeleteRoleActionResult =
  { ok: true } | { ok: false; message: string; isDefaultRole?: boolean };

/** Resultado de `PUT /api/servers/:id/default-role`. */
export type SetDefaultRoleActionResult =
  { ok: true } | { ok: false; message: string };

/** Resultado de `GET /api/servers/:id/members/:userId/roles`. */
export type ListMemberRolesActionResult =
  { ok: true; roles: Role[] } | { ok: false; message: string };

/** Resultado de `POST /api/servers/:id/members/:userId/roles`. */
export type AssignRoleActionResult =
  { ok: true; role: Role } | { ok: false; message: string };

/** Resultado de `DELETE /api/servers/:id/members/:userId/roles/:roleId`. */
export type RemoveRoleActionResult =
  { ok: true } | { ok: false; message: string };
