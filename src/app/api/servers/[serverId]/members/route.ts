import { NextResponse } from "next/server";

import { getSession } from "@/services/auth/session";
import { listMembers } from "@/services/members/service";
import type { ListMembersActionResult } from "@/types/member.types";

const SESSION_EXPIRED = "Tu sesión expiró. Volvé a iniciar sesión.";

/**
 * BFF de `GET /v1/servers/:id/members`. El navegador pega aca (mismo
 * origen); reenvia el JWT de la cookie httpOnly, nunca lo expone.
 */
export async function GET(
  _request: Request,
  { params }: { params: { serverId: string } },
): Promise<NextResponse<ListMembersActionResult>> {
  const session = getSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, message: SESSION_EXPIRED },
      { status: 401 },
    );
  }

  const result = await listMembers(session.token, params.serverId);
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
        message: "No pudimos cargar los miembros. Intenta de nuevo.",
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
