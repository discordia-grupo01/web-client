import {
  type ListMembersResult,
  MEMBERS_LOAD_FAILED,
} from "@discordia/client-shared";

import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/api-route";
import { getValidSession } from "@/services/auth/session";
import { listMembers } from "@/services/members/service";

/**
 * BFF de `GET /v1/servers/:id/members`. El navegador pega aca (mismo
 * origen); reenvia el JWT de la cookie httpOnly, nunca lo expone.
 */
export async function GET(
  _request: Request,
  { params }: { params: { serverId: string } },
): Promise<NextResponse<ListMembersResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const result = await listMembers(session.token, params.serverId);
  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    return NextResponse.json(
      {
        ok: false,
        message: MEMBERS_LOAD_FAILED,
      },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  return NextResponse.json(
    { ok: true, members: result.data.members, total: result.data.total },
    { status: 200 },
  );
}
