import {
  type UnmuteMemberResult,
  unmuteFailureMessage,
} from "@discordia/client-shared";
import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { getValidSession } from "@/services/auth/session";
import { unmuteMember } from "@/services/moderation/service";

/** BFF de `DELETE /v1/servers/:id/mutes/:userId`: levanta el silencio. */
export async function DELETE(
  _request: Request,
  { params }: { params: { serverId: string; userId: string } },
): Promise<NextResponse<UnmuteMemberResult>> {
  const session = await getValidSession();
  if (!session) return unauthorizedResponse();

  const result = await unmuteMember(
    session.token,
    params.serverId,
    params.userId,
  );
  if (!result.ok) {
    if (result.status === 401) return unauthorizedResponse();
    return NextResponse.json(
      { ok: false, message: unmuteFailureMessage(result) },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }
  return NextResponse.json({ ok: true });
}
