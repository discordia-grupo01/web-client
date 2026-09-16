import { NextResponse } from "next/server";

import { getSession } from "@/features/auth/session";
import { setDefaultRole } from "@/features/servers/service";
import type { SetDefaultRoleActionResult } from "@/features/servers/types";

const SESSION_EXPIRED = "Tu sesión expiró. Volvé a iniciar sesión.";

/**
 * BFF de `PUT /v1/servers/:id/default-role`. Body JSON: `{ roleId }`.
 *
 * Nota: el back no expone en ningun lado cual es el rol por defecto actual
 * (no viaja en la respuesta del server) -- este endpoint solo permite
 * *fijarlo*, no consultarlo.
 */
export async function PUT(
  request: Request,
  { params }: { params: { serverId: string } },
): Promise<NextResponse<SetDefaultRoleActionResult>> {
  const session = getSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, message: SESSION_EXPIRED },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null);
  const roleId = typeof body?.roleId === "string" ? body.roleId : "";

  const result = await setDefaultRole(session.token, params.serverId, roleId);

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
          message:
            "No tenés permisos de administración para definir el rol por defecto.",
        },
        { status: 403 },
      );
    }
    if (result.status === 404) {
      return NextResponse.json(
        { ok: false, message: "No encontramos ese rol." },
        { status: 404 },
      );
    }
    return NextResponse.json(
      {
        ok: false,
        message: "No pudimos definir el rol por defecto. Intenta de nuevo.",
      },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
