import {
  MEMBER_OR_ROLE_NOT_FOUND,
  MEMBER_ROLE_ASSIGN_FAILED,
  MEMBER_ROLES_LOAD_FAILED,
  OWNER_ONLY_ASSIGN_ROLE,
} from "@discordia/client-shared";

import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/api-route";
import { getValidSession } from "@/services/auth/session";
import { assignRole, listMemberRoles } from "@/services/roles/service";
import type {
  AssignRoleActionResult,
  ListMemberRolesActionResult,
} from "@/types/role.types";

/**
 * BFF de `GET /v1/servers/:id/members/:userId/roles`.
 */
export async function GET(
  _request: Request,
  { params }: { params: { serverId: string; userId: string } },
): Promise<NextResponse<ListMemberRolesActionResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const result = await listMemberRoles(
    session.token,
    params.serverId,
    params.userId,
  );
  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    return NextResponse.json(
      {
        ok: false,
        message: MEMBER_ROLES_LOAD_FAILED,
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
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
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
      return unauthorizedResponse();
    }
    if (result.status === 403) {
      return NextResponse.json(
        {
          ok: false,
          message: OWNER_ONLY_ASSIGN_ROLE,
        },
        { status: 403 },
      );
    }
    if (result.status === 404) {
      return NextResponse.json(
        { ok: false, message: MEMBER_OR_ROLE_NOT_FOUND },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { ok: false, message: MEMBER_ROLE_ASSIGN_FAILED },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  return NextResponse.json({ ok: true, role: result.data }, { status: 200 });
}
