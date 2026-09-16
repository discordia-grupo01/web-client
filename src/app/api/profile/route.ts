import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/api-route";
import { createSession, getSession } from "@/services/auth/session";
import { getOwnProfile, updateOwnProfile } from "@/services/profile/service";
import type {
  GetOwnProfileActionResult,
  UpdateOwnProfileActionResult,
} from "@/types/profile.types";

/**
 * BFF de `GET /v1/me/profile`. Perfil propio del usuario autenticado (no el
 * publico de `/api/users/:id`): incluye email y description.
 */
export async function GET(): Promise<NextResponse<GetOwnProfileActionResult>> {
  const session = getSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const result = await getOwnProfile(session.token);
  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    return NextResponse.json(
      { ok: false, message: "No pudimos cargar tu perfil." },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  return NextResponse.json({ ok: true, user: result.data }, { status: 200 });
}

/**
 * BFF de `PATCH /v1/me/profile`. Recibe el FormData tal cual llega del
 * navegador (multipart/form-data: name/description/image, todos opcionales)
 * y lo reenvia al servicio. Si sale bien, refresca la cookie de sesion con
 * los datos nuevos (name/avatar/etc pueden haber cambiado).
 */
export async function PATCH(
  request: Request,
): Promise<NextResponse<UpdateOwnProfileActionResult>> {
  const session = getSession();
  if (!session) {
    return unauthorizedResponse();
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Petición inválida." },
      { status: 400 },
    );
  }

  const result = await updateOwnProfile(session.token, formData);

  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    return NextResponse.json(
      { ok: false, message: result.message },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  createSession({ token: session.token, user: result.data });

  return NextResponse.json({ ok: true, user: result.data }, { status: 200 });
}
