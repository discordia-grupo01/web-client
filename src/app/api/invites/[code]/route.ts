import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/api-route";
import { getSession } from "@/services/auth/session";
import { revokeInvitation } from "@/services/invites/service";
import type { RevokeInviteActionResult } from "@/types/invite.types";

/**
 * BFF de `DELETE /v1/invites/:code`. Idempotente del lado del back: revocar
 * un codigo ya revocado (o ya vencido) tambien devuelve 204.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: { code: string } },
): Promise<NextResponse<RevokeInviteActionResult>> {
  const session = getSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const result = await revokeInvitation(session.token, params.code);
  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    return NextResponse.json(
      { ok: false, message: "Algo salio mal. Intenta de nuevo." },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
