import {
  type AssignRoleResult,
  type CreateRoleResult,
  DEFAULT_ROLE_SET_FAILED,
  type DeleteRoleResult,
  type ListMemberRolesResult,
  type ListRolesResult,
  MEMBER_ROLE_ASSIGN_FAILED,
  MEMBER_ROLE_REMOVE_FAILED,
  MEMBER_ROLES_LOAD_FAILED,
  type RemoveRoleResult,
  ROLE_CREATE_FAILED,
  ROLE_DELETE_FAILED,
  ROLE_UPDATE_FAILED,
  type RolePermission,
  ROLES_LOAD_FAILED,
  type SetDefaultRoleResult,
  type UpdateRoleResult,
} from "@discordia/client-shared";

import { api } from "@/lib/browser-api-client";

/**
 * Llamadas del navegador hacia el BFF (`/api/roles`, `/api/servers/:id/roles`,
 * mismo origen). Nunca pega directo al gateway: el JWT nunca sale del
 * servidor de Next.
 */

export async function createRoleRequest(
  serverId: string,
  input: { name: string; color: string },
): Promise<CreateRoleResult> {
  try {
    const { data } = await api.post<CreateRoleResult>(
      `/servers/${serverId}/roles`,
      input,
    );
    return data;
  } catch {
    return {
      ok: false,
      message: ROLE_CREATE_FAILED,
    };
  }
}

export async function listRolesRequest(
  serverId: string,
): Promise<ListRolesResult> {
  try {
    const { data } = await api.get<ListRolesResult>(
      `/servers/${serverId}/roles`,
    );
    return data;
  } catch {
    return {
      ok: false,
      message: ROLES_LOAD_FAILED,
    };
  }
}

/** `permissions: undefined` deja los permisos actuales sin tocar. */
export async function updateRoleRequest(
  roleId: string,
  input: { name?: string; color?: string; permissions?: RolePermission[] },
): Promise<UpdateRoleResult> {
  try {
    const { data } = await api.patch<UpdateRoleResult>(
      `/roles/${roleId}`,
      input,
    );
    return data;
  } catch {
    return {
      ok: false,
      message: ROLE_UPDATE_FAILED,
    };
  }
}

/** 409 (`isDefaultRole: true`) si el rol es el rol por defecto del servidor. */
export async function deleteRoleRequest(
  roleId: string,
): Promise<DeleteRoleResult> {
  try {
    const { data } = await api.delete<DeleteRoleResult>(`/roles/${roleId}`);
    return data;
  } catch {
    return {
      ok: false,
      message: ROLE_DELETE_FAILED,
    };
  }
}

export async function setDefaultRoleRequest(
  serverId: string,
  roleId: string,
): Promise<SetDefaultRoleResult> {
  try {
    const { data } = await api.put<SetDefaultRoleResult>(
      `/servers/${serverId}/default-role`,
      { roleId },
    );
    return data;
  } catch {
    return {
      ok: false,
      message: DEFAULT_ROLE_SET_FAILED,
    };
  }
}

export async function listMemberRolesRequest(
  serverId: string,
  userId: string,
): Promise<ListMemberRolesResult> {
  try {
    const { data } = await api.get<ListMemberRolesResult>(
      `/servers/${serverId}/members/${userId}/roles`,
    );
    return data;
  } catch {
    return {
      ok: false,
      message: MEMBER_ROLES_LOAD_FAILED,
    };
  }
}

export async function assignRoleRequest(
  serverId: string,
  userId: string,
  roleId: string,
): Promise<AssignRoleResult> {
  try {
    const { data } = await api.post<AssignRoleResult>(
      `/servers/${serverId}/members/${userId}/roles`,
      { roleId },
    );
    return data;
  } catch {
    return {
      ok: false,
      message: MEMBER_ROLE_ASSIGN_FAILED,
    };
  }
}

export async function removeRoleRequest(
  serverId: string,
  userId: string,
  roleId: string,
): Promise<RemoveRoleResult> {
  try {
    const { data } = await api.delete<RemoveRoleResult>(
      `/servers/${serverId}/members/${userId}/roles/${roleId}`,
    );
    return data;
  } catch {
    return {
      ok: false,
      message: MEMBER_ROLE_REMOVE_FAILED,
    };
  }
}
