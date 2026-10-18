import {
  type ListRoleMembersResult,
  listRoleMembersFailureMessage,
} from "@discordia/client-shared";
import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { memberPageQueryFrom } from "@/lib/memberPageQuery";
import { getValidSession } from "@/services/auth/session";
import { listRoleMembers } from "@/services/roles/service";

/**
 * BFF de `GET /v1/roles/:id/members`: una pagina de los que tienen el rol (o
 * con `has_role=false`, de los que no), opcionalmente filtrada por nombre.
 */
export async function GET(
  request: Request,
  { params }: { params: { roleId: string } },
): Promise<NextResponse<ListRoleMembersResult>> {
  const session = await getValidSession();
  if (!session) return unauthorizedResponse();

  const result = await listRoleMembers(
    session.token,
    params.roleId,
    memberPageQueryFrom(request.url),
  );
  if (!result.ok) {
    if (result.status === 401) return unauthorizedResponse();
    return NextResponse.json(
      { ok: false, message: listRoleMembersFailureMessage(result) },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }
  return NextResponse.json({
    ok: true,
    members: result.data.members,
    total: result.data.total,
  });
}
