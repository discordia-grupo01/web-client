import { NextResponse } from "next/server";

import { getSession } from "@/features/auth/session";
import { removeRole } from "@/features/roles/service";
import type { RemoveRoleActionResult } from "@/features/roles/types";

const SESSION_EXPIRED = "Tu sesión expiró. Volvé a iniciar sesión.";

/**
 * BFF de `DELETE /v1/servers/:id/members/:userId/roles/:roleId`. A
 * diferencia de asignar, esto NO es idempotente: el back devuelve 404 si el
 * miembro no tenia ese rol.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: { serverId: string; userId: string; roleId: string } },
): Promise<NextResponse<RemoveRoleActionResult>> {
  const session = getSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, message: SESSION_EXPIRED },
      { status: 401 },
    );
  }

  const result = await removeRole(
    session.token,
    params.serverId,
    params.userId,
    params.roleId,
  );

  if (!result.ok) {
    if (result.status === 401) {
      return NextResponse.json(
        { ok: false, message: SESSION_EXPIRED },
        { status: 401 },
      );
    }
    if (result.status === 403) {
      return NextResponse.json(
        {
          ok: false,
          message: "No tenés permisos de administración para quitar roles.",
        },
        { status: 403 },
      );
    }
    if (result.status === 404) {
      return NextResponse.json(
        { ok: false, message: "Ese miembro no tiene ese rol." },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { ok: false, message: "No pudimos quitar el rol. Intenta de nuevo." },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
