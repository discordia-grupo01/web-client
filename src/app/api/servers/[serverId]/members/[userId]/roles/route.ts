import { NextResponse } from "next/server";

import { getSession } from "@/services/auth/session";
import { assignRole, listMemberRoles } from "@/services/roles/service";
import type {
  AssignRoleActionResult,
  ListMemberRolesActionResult,
} from "@/services/roles/types";

const SESSION_EXPIRED = "Tu sesión expiró. Volvé a iniciar sesión.";

/**
 * BFF de `GET /v1/servers/:id/members/:userId/roles`.
 */
export async function GET(
  _request: Request,
  { params }: { params: { serverId: string; userId: string } },
): Promise<NextResponse<ListMemberRolesActionResult>> {
  const session = getSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, message: SESSION_EXPIRED },
      { status: 401 },
    );
  }

  const result = await listMemberRoles(
    session.token,
    params.serverId,
    params.userId,
  );
  if (!result.ok) {
    if (result.status === 401) {
      return NextResponse.json(
        { ok: false, message: SESSION_EXPIRED },
        { status: 401 },
      );
    }
    return NextResponse.json(
      {
        ok: false,
        message: "No pudimos cargar los roles del miembro. Intenta de nuevo.",
      },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  return NextResponse.json({ ok: true, roles: result.data }, { status: 200 });
}

/**
 * BFF de `POST /v1/servers/:id/members/:userId/roles`. Body JSON:
 * `{ roleId }`. Asignar un rol que el miembro ya tiene es idempotente (el
 * back no lo duplica ni rechaza).
 */
export async function POST(
  request: Request,
  { params }: { params: { serverId: string; userId: string } },
): Promise<NextResponse<AssignRoleActionResult>> {
  const session = getSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, message: SESSION_EXPIRED },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null);
  const roleId = typeof body?.roleId === "string" ? body.roleId : "";

  const result = await assignRole(
    session.token,
    params.serverId,
    params.userId,
    roleId,
  );

  if (!result.ok) {
    if (result.status === 401) {
      return NextResponse.json(
        { ok: false, message: SESSION_EXPIRED },
        { status: 401 },
      );
    }
    if (result.status === 403) {
      return NextResponse.json(
        {
          ok: false,
          message: "No tenés permisos de administración para asignar roles.",
        },
        { status: 403 },
      );
    }
    if (result.status === 404) {
      return NextResponse.json(
        { ok: false, message: "No encontramos ese rol o ese miembro." },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { ok: false, message: "No pudimos asignar el rol. Intenta de nuevo." },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  return NextResponse.json({ ok: true, role: result.data }, { status: 200 });
}
