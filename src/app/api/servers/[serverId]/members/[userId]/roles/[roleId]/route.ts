import {
  MEMBER_ROLE_NOT_ASSIGNED,
  MEMBER_ROLE_REMOVE_FAILED,
  OWNER_ONLY_REMOVE_ROLE,
} from "@discordia/client-shared";

import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/api-route";
import { getValidSession } from "@/services/auth/session";
import { removeRole } from "@/services/roles/service";
import type { RemoveRoleActionResult } from "@/types/role.types";

/**
 * BFF de `DELETE /v1/servers/:id/members/:userId/roles/:roleId`. A
 * diferencia de asignar, esto NO es idempotente: el back devuelve 404 si el
 * miembro no tenia ese rol.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: { serverId: string; userId: string; roleId: string } },
): Promise<NextResponse<RemoveRoleActionResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const result = await removeRole(
    session.token,
    params.serverId,
    params.userId,
    params.roleId,
  );

  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    if (result.status === 403) {
      return NextResponse.json(
        {
          ok: false,
          message: OWNER_ONLY_REMOVE_ROLE,
        },
        { status: 403 },
      );
    }
    if (result.status === 404) {
      return NextResponse.json(
        { ok: false, message: MEMBER_ROLE_NOT_ASSIGNED },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { ok: false, message: MEMBER_ROLE_REMOVE_FAILED },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
