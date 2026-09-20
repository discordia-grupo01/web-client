import { PROFILE_LOAD_FAILED } from "@discordia/client-shared";

import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/api-route";
import { getValidSession } from "@/services/auth/session";
import { getPublicProfile } from "@/services/profile/service";
import type { GetPublicProfileActionResult } from "@/types/profile.types";

/**
 * BFF de `GET /v1/users/:id` (identify-service, via Kong). Resuelve el
 * perfil público de otro usuario -- hoy se usa para mostrar el nombre real
 * en vez del `user_id` crudo en la lista de miembros de un server.
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse<GetPublicProfileActionResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const result = await getPublicProfile(session.token, params.id);
  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    return NextResponse.json(
      { ok: false, message: PROFILE_LOAD_FAILED },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  return NextResponse.json({ ok: true, user: result.data }, { status: 200 });
}
