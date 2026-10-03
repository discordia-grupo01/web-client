import {
  messageFor,
  type ReorderRolesResult,
  ROLE_REASONS,
  ROLE_REORDER_FAILED,
} from "@discordia/client-shared";
import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { getValidSession } from "@/services/auth/session";
import { reorderRoles } from "@/services/roles/service";

/**
 * BFF de `PATCH /v1/servers/:id/roles/reorder`
 */
export async function PATCH(
  request: Request,
  { params }: { params: { serverId: string } },
): Promise<NextResponse<ReorderRolesResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const body = await request.json().catch(() => null);
  const roleIds = Array.isArray(body?.roleIds)
    ? (body.roleIds as string[])
    : null;

  if (!roleIds) {
    return NextResponse.json(
      { ok: false, message: ROLE_REORDER_FAILED },
      { status: 400 },
    );
  }

  const result = await reorderRoles(session.token, params.serverId, roleIds);

  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    return NextResponse.json(
      {
        ok: false,
        message: messageFor(result, ROLE_REASONS, ROLE_REORDER_FAILED),
      },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  return NextResponse.json({ ok: true, roles: result.data }, { status: 200 });
}
