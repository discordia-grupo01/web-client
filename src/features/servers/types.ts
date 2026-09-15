/** Canal tal como viene embebido en la respuesta de un servidor. */
export interface Channel {
  id: string;
  name: string;
  kind: "text" | "voice";
  position: number;
  category_id: string | null;
  topic: string | null;
}

/** Categoria tal como viene embebida en la respuesta de un servidor. */
export interface Category {
  id: string;
  server_id: string;
  name: string;
  position: number;
}

/** Servidor tal como lo devuelve el servicio `servers` (via el gateway). */
export interface ServerSummary {
  id: string;
  name: string;
  icon_url: string | null;
  owner_id: string;
  created_at: string;
  channels: Channel[];
  categories: Category[];
}

/** Forma de error de `servers`: `{ error: { code, message, details? } }`. */
export interface ServersApiErrorBody {
  error: {
    code: number;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface CreateServerFieldErrors {
  name?: string;
  icon?: string;
}

export interface CreateChannelFieldErrors {
  name?: string;
  kind?: string;
  category_id?: string;
}

/** Resultado de `POST /api/servers/:id/channels`. */
export type CreateChannelActionResult =
  | { ok: true; channel: Channel }
  | { ok: false; message: string; fieldErrors?: CreateChannelFieldErrors };

export interface UpdateChannelFieldErrors {
  name?: string;
}

/** Resultado de `PATCH /api/channels/:id`. */
export type UpdateChannelActionResult =
  | { ok: true; channel: Channel }
  | { ok: false; message: string; fieldErrors?: UpdateChannelFieldErrors };

/** Resultado de `DELETE /api/channels/:id`. */
export type DeleteChannelActionResult =
  { ok: true } | { ok: false; message: string };

/** Resultado de `PATCH /api/channels/:id/category`. */
export type MoveChannelActionResult =
  { ok: true; channel: Channel } | { ok: false; message: string };

export interface CategoryFieldErrors {
  name?: string;
}

/** Resultado de `POST /api/servers/:id/categories`. */
export type CreateCategoryActionResult =
  | { ok: true; category: Category }
  | { ok: false; message: string; fieldErrors?: CategoryFieldErrors };

/** Resultado de `PATCH /api/categories/:id`. */
export type UpdateCategoryActionResult =
  | { ok: true; category: Category }
  | { ok: false; message: string; fieldErrors?: CategoryFieldErrors };

/**
 * Resultado de `PATCH /api/servers/:id/channels/reorder`. El back exige que
 * `channelIds` sea exactamente el set de canales que ya está en esa
 * categoría (o en "sin categoría" si es `null`), ni más ni menos.
 */
export type ReorderChannelsActionResult =
  { ok: true } | { ok: false; message: string };

/** Resultado de `POST /api/servers`. Nunca incluye el token. */
export type CreateServerActionResult =
  | { ok: true; server: ServerSummary }
  | { ok: false; message: string; fieldErrors?: CreateServerFieldErrors };

export interface JoinServerFieldErrors {
  code?: string;
}

/** Resultado de `POST /api/invites/:code/join`. */
export type JoinServerActionResult =
  | { ok: true; server: ServerSummary; alreadyMember: boolean }
  | { ok: false; message: string; fieldErrors?: JoinServerFieldErrors };

/**
 * Resultado de `DELETE /api/servers/:id/leave`. El backend bloquea esto para
 * el owner (409, `details.reason: "owner_must_transfer_or_delete"`): en ese
 * caso `isOwnerBlocked` es `true` y `message` ya viene con la copia final.
 */
export type LeaveServerActionResult =
  { ok: true } | { ok: false; message: string; isOwnerBlocked?: boolean };

/**
 * Miembro tal como lo devuelve `GET /v1/servers/:id/members`. El backend solo
 * conoce el `user_id`; el nombre se resuelve aparte contra identify-service
 * (`getPublicProfileRequest`, ver `features/auth/client.ts`), uno por
 * miembro -- no hay un endpoint batch todavia.
 */
export interface Member {
  user_id: string;
  is_owner: boolean;
  joined_at: string;
}

/** Resultado de `GET /api/servers/:id/members`. */
export type ListMembersActionResult =
  | { ok: true; members: Member[]; total: number }
  | { ok: false; message: string };

/** Invitación tal como la devuelve `servers` (create o get). */
export interface Invitation {
  code: string;
  url: string;
  server_id: string;
  created_by: string;
  max_uses: number | null;
  uses: number;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

export interface CreateInviteFieldErrors {
  max_uses?: string;
}

/** Resultado de `POST /api/servers/:id/invites`. */
export type CreateInviteActionResult =
  | { ok: true; invitation: Invitation }
  | { ok: false; message: string; fieldErrors?: CreateInviteFieldErrors };

/** Resultado de `DELETE /api/invites/:code`. Idempotente del lado del back. */
export type RevokeInviteActionResult =
  { ok: true } | { ok: false; message: string };

/**
 * Resultado de `GET /api/servers/:id/invites`. Trae TODAS las invitaciones
 * del server (activas, revocadas o vencidas), más nuevas primero. El back no
 * filtra por estado ni limita a una activa por server -- el front calcula el
 * estado de cada una (ver `inviteStatus` en invite-modal.tsx).
 */
export type ListInvitationsActionResult =
  { ok: true; invitations: Invitation[] } | { ok: false; message: string };

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
