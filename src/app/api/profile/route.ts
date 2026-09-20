import {
  type GetOwnProfileResult,
  OWN_PROFILE_LOAD_FAILED,
  UNEXPECTED_ERROR_MESSAGE,
  type UpdateOwnProfileResult,
} from "@discordia/client-shared";

import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/api-route";
import { createSession, getValidSession } from "@/services/auth/session";
import { getOwnProfile, updateOwnProfile } from "@/services/profile/service";

/**
 * BFF de `GET /v1/me/profile`. Perfil propio del usuario autenticado (no el
 * publico de `/api/users/:id`): incluye email y description.
 */
export async function GET(): Promise<NextResponse<GetOwnProfileResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const result = await getOwnProfile(session.token);
  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    return NextResponse.json(
      { ok: false, message: OWN_PROFILE_LOAD_FAILED },
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
): Promise<NextResponse<UpdateOwnProfileResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { ok: false, message: UNEXPECTED_ERROR_MESSAGE },
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

  createSession({ ...session, user: result.data });

  return NextResponse.json({ ok: true, user: result.data }, { status: 200 });
}
