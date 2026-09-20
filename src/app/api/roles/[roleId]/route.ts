import {
  fieldOf,
  invalidPermissionMessage,
  messageFor,
  OWNER_ONLY_DELETE_ROLE,
  OWNER_ONLY_UPDATE_ROLE,
  reasonOf,
  ROLE_DELETE_FAILED,
  ROLE_IS_DEFAULT,
  ROLE_NOT_FOUND,
  ROLE_REASONS,
  ROLE_UPDATE_FAILED,
} from "@discordia/client-shared";
import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/api-route";
import { getValidSession } from "@/services/auth/session";
import { deleteRole, updateRole } from "@/services/roles/service";
import type {
  DeleteRoleActionResult,
  RolePermission,
  UpdateRoleActionResult,
} from "@/types/role.types";

/**
 * BFF de `PATCH /v1/roles/:id`. Body JSON: `{ name?, color?, permissions? }`.
 * `permissions` ausente deja los permisos actuales sin tocar; `[]` los vacia.
 * Los cambios se aplican de inmediato a todos los miembros que tengan el rol
 * (no hay paso de "publicar" aparte).
 */
export async function PATCH(
  request: Request,
  { params }: { params: { roleId: string } },
): Promise<NextResponse<UpdateRoleActionResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name : undefined;
  const color = typeof body?.color === "string" ? body.color : undefined;
  const permissions = Array.isArray(body?.permissions)
    ? (body.permissions as RolePermission[])
    : undefined;

  const result = await updateRole(session.token, params.roleId, {
    name,
    color,
    permissions,
  });

  if (!result.ok) {
    const field = fieldOf(result.details);
    const reason = reasonOf(result.details);
    const friendly = reason ? ROLE_REASONS[reason] : undefined;

    if ((field === "name" || field === "color") && friendly) {
      return NextResponse.json(
        { ok: false, message: friendly, fieldErrors: { [field]: friendly } },
        { status: result.status || 400 },
      );
    }
    if (field === "permissions") {
      const message = invalidPermissionMessage(result.details?.invalid_value);
      return NextResponse.json(
        { ok: false, message, fieldErrors: { permissions: message } },
        { status: result.status || 400 },
      );
    }
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    if (result.status === 403) {
      return NextResponse.json(
        {
          ok: false,
          message: OWNER_ONLY_UPDATE_ROLE,
        },
        { status: 403 },
      );
    }
    if (result.status === 404) {
      return NextResponse.json(
        { ok: false, message: ROLE_NOT_FOUND },
        { status: 404 },
      );
    }
    return NextResponse.json(
      {
        ok: false,
        message: messageFor(result, ROLE_REASONS, ROLE_UPDATE_FAILED),
      },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  return NextResponse.json({ ok: true, role: result.data }, { status: 200 });
}

/**
 * BFF de `DELETE /v1/roles/:id`. El back devuelve 409 si es el rol por
 * defecto del servidor (hay que asignar otro antes de poder borrar este).
 */
export async function DELETE(
  _request: Request,
  { params }: { params: { roleId: string } },
): Promise<NextResponse<DeleteRoleActionResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const result = await deleteRole(session.token, params.roleId);

  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    if (result.status === 403) {
      return NextResponse.json(
        {
          ok: false,
          message: OWNER_ONLY_DELETE_ROLE,
        },
        { status: 403 },
      );
    }
    if (result.status === 409) {
      return NextResponse.json(
        {
          ok: false,
          isDefaultRole: true,
          message: ROLE_IS_DEFAULT,
        },
        { status: 409 },
      );
    }
    if (result.status === 404) {
      return NextResponse.json(
        { ok: false, message: ROLE_NOT_FOUND },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { ok: false, message: ROLE_DELETE_FAILED },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
