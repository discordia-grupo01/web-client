import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/api-route";
import { getSession } from "@/services/auth/session";
import { deleteRole, updateRole } from "@/services/roles/service";
import type {
  DeleteRoleActionResult,
  RolePermission,
  UpdateRoleActionResult,
} from "@/types/role.types";

const REASON_MESSAGES: Record<string, string> = {
  name_required: "Ingresá un nombre para el rol.",
  name_too_long: "El nombre es demasiado largo.",
  color_invalid_format: "Elegí un color válido para el rol.",
};

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
  const session = getSession();
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
    const field =
      typeof result.details?.field === "string"
        ? result.details.field
        : undefined;
    const reason =
      typeof result.details?.reason === "string"
        ? result.details.reason
        : undefined;
    const friendly = reason ? REASON_MESSAGES[reason] : undefined;

    if ((field === "name" || field === "color") && friendly) {
      return NextResponse.json(
        { ok: false, message: friendly, fieldErrors: { [field]: friendly } },
        { status: result.status || 400 },
      );
    }
    if (field === "permissions") {
      const invalidValue =
        typeof result.details?.invalid_value === "string"
          ? result.details.invalid_value
          : undefined;
      const message = invalidValue
        ? `"${invalidValue}" no es un permiso válido.`
        : "Uno de los permisos enviados no es válido.";
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
          message: "No tenés permisos de administración para editar roles.",
        },
        { status: 403 },
      );
    }
    if (result.status === 404) {
      return NextResponse.json(
        { ok: false, message: "No encontramos ese rol." },
        { status: 404 },
      );
    }
    return NextResponse.json(
      {
        ok: false,
        message: friendly ?? "No pudimos editar el rol. Intenta de nuevo.",
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
  const session = getSession();
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
          message: "No tenés permisos de administración para eliminar roles.",
        },
        { status: 403 },
      );
    }
    if (result.status === 409) {
      return NextResponse.json(
        {
          ok: false,
          isDefaultRole: true,
          message:
            "No podés eliminar este rol porque es el rol por defecto del servidor. Asigná otro rol por defecto primero.",
        },
        { status: 409 },
      );
    }
    if (result.status === 404) {
      return NextResponse.json(
        { ok: false, message: "No encontramos ese rol." },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { ok: false, message: "No pudimos eliminar el rol. Intenta de nuevo." },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
