import {
  BAN_REASONS,
  messageFor,
  OWNER_ONLY_UNBAN,
  type UnbanMemberResult,
  UNEXPECTED_ERROR_MESSAGE,
} from "@discordia/client-shared";
import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { getValidSession } from "@/services/auth/session";
import { unbanMember } from "@/services/bans/service";

/**
 * BFF de `DELETE /v1/servers/:id/bans/:userId`: revoca el baneo. No hay
 * chequeo de jerarquia del lado del back, solo el permiso `BAN_MEMBERS`.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: { serverId: string; userId: string } },
): Promise<NextResponse<UnbanMemberResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const result = await unbanMember(
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
        message:
          result.status === 403
            ? OWNER_ONLY_UNBAN
            : messageFor(result, BAN_REASONS, UNEXPECTED_ERROR_MESSAGE),
      },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
