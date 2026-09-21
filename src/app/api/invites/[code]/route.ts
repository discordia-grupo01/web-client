import {
  type RevokeInviteResult,
  UNEXPECTED_ERROR_MESSAGE,
} from "@discordia/client-shared";

import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/api-route";
import { getValidSession } from "@/services/auth/session";
import { revokeInvitation } from "@/services/invites/service";

/**
 * BFF de `DELETE /v1/invites/:code`. Idempotente del lado del back: revocar
 * un codigo ya revocado (o ya vencido) tambien devuelve 204.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: { code: string } },
): Promise<NextResponse<RevokeInviteResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const result = await revokeInvitation(session.token, params.code);
  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    return NextResponse.json(
      { ok: false, message: UNEXPECTED_ERROR_MESSAGE },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
