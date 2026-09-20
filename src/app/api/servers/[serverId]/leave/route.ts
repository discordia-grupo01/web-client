import { reasonOf, UNEXPECTED_ERROR_MESSAGE } from "@discordia/client-shared";
import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/api-route";
import { getValidSession } from "@/services/auth/session";
import { leaveServer } from "@/services/servers/service";
import type { LeaveServerActionResult } from "@/types/server.types";

const OWNER_BLOCKED_MESSAGE =
  "Sos el propietario de este servidor. Transferí la propiedad a otro miembro antes de salir.";

/**
 * BFF de `DELETE /v1/servers/:id/members/:userId`. Siempre pega con el id
 * del usuario de la sesion: es self-leave, no hay endpoint de "kick" aca.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: { serverId: string } },
): Promise<NextResponse<LeaveServerActionResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const result = await leaveServer(
    session.token,
    params.serverId,
    String(session.user.id),
  );

  if (!result.ok) {
    const reason = reasonOf(result.details);

    if (reason === "owner_must_transfer_or_delete") {
      return NextResponse.json(
        { ok: false, message: OWNER_BLOCKED_MESSAGE, isOwnerBlocked: true },
        { status: 409 },
      );
    }
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
