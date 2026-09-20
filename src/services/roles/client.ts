import {
  DEFAULT_ROLE_SET_FAILED,
  MEMBER_ROLE_ASSIGN_FAILED,
  MEMBER_ROLE_REMOVE_FAILED,
  MEMBER_ROLES_LOAD_FAILED,
  ROLE_CREATE_FAILED,
  ROLE_DELETE_FAILED,
  ROLE_UPDATE_FAILED,
  ROLES_LOAD_FAILED,
} from "@discordia/client-shared";

import { api } from "@/lib/browser-api-client";

import type {
  AssignRoleActionResult,
  CreateRoleActionResult,
  DeleteRoleActionResult,
  ListMemberRolesActionResult,
  ListRolesActionResult,
  RemoveRoleActionResult,
  RolePermission,
  SetDefaultRoleActionResult,
  UpdateRoleActionResult,
} from "@/types/role.types";

/**
 * Llamadas del navegador hacia el BFF (`/api/roles`, `/api/servers/:id/roles`,
 * mismo origen). Nunca pega directo al gateway: el JWT nunca sale del
 * servidor de Next.
 */

export async function createRoleRequest(
  serverId: string,
  input: { name: string; color: string },
): Promise<CreateRoleActionResult> {
  try {
    const { data } = await api.post<CreateRoleActionResult>(
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
): Promise<ListRolesActionResult> {
  try {
    const { data } = await api.get<ListRolesActionResult>(
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
): Promise<UpdateRoleActionResult> {
  try {
    const { data } = await api.patch<UpdateRoleActionResult>(
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
): Promise<DeleteRoleActionResult> {
  try {
    const { data } = await api.delete<DeleteRoleActionResult>(
      `/roles/${roleId}`,
    );
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
): Promise<SetDefaultRoleActionResult> {
  try {
    const { data } = await api.put<SetDefaultRoleActionResult>(
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
): Promise<ListMemberRolesActionResult> {
  try {
    const { data } = await api.get<ListMemberRolesActionResult>(
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
): Promise<AssignRoleActionResult> {
  try {
    const { data } = await api.post<AssignRoleActionResult>(
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
): Promise<RemoveRoleActionResult> {
  try {
    const { data } = await api.delete<RemoveRoleActionResult>(
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
