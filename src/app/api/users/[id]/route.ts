import { NextResponse } from "next/server";

import { getPublicProfile } from "@/features/auth/service";
import { getSession } from "@/features/auth/session";
import type { GetPublicProfileActionResult } from "@/features/auth/types";

const SESSION_EXPIRED = "Tu sesion expiro. Volve a iniciar sesion.";

/**
 * BFF de `GET /v1/users/:id` (identify-service, via Kong). Resuelve el
 * perfil público de otro usuario -- hoy se usa para mostrar el nombre real
 * en vez del `user_id` crudo en la lista de miembros de un server.
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse<GetPublicProfileActionResult>> {
  const session = getSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, message: SESSION_EXPIRED },
      { status: 401 },
    );
  }

  const result = await getPublicProfile(session.token, params.id);
  if (!result.ok) {
    if (result.status === 401) {
      return NextResponse.json(
        { ok: false, message: SESSION_EXPIRED },
        { status: 401 },
      );
    }
    return NextResponse.json(
      { ok: false, message: "No pudimos cargar el perfil." },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  return NextResponse.json({ ok: true, user: result.data }, { status: 200 });
}
