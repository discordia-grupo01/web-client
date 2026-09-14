import { NextResponse } from "next/server";

import { getSession } from "@/features/auth/session";
import { revokeInvitation } from "@/features/servers/service";
import type { RevokeInviteActionResult } from "@/features/servers/types";

const SESSION_EXPIRED = "Tu sesion expiro. Volve a iniciar sesion.";

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
    return NextResponse.json(
      { ok: false, message: SESSION_EXPIRED },
      { status: 401 },
    );
  }

  const result = await revokeInvitation(session.token, params.code);
  if (!result.ok) {
    if (result.status === 401) {
      return NextResponse.json(
        { ok: false, message: SESSION_EXPIRED },
        { status: 401 },
      );
    }
    return NextResponse.json(
      { ok: false, message: "Algo salio mal. Intenta de nuevo." },
      { status: result.status >= 400 && result.status < 500 ? result.status : 502 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
