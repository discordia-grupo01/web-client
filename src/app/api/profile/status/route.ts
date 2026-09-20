import { UNEXPECTED_ERROR_MESSAGE } from "@discordia/client-shared";

import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/api-route";
import { createSession, getValidSession } from "@/services/auth/session";
import { clearStatus, updateStatus } from "@/services/profile/service";
import type { UpdateCustomStatusActionResult } from "@/types/profile.types";

/**
 * BFF de `PUT`/`DELETE /v1/me/status` (estado personalizado). El campo
 * `status_emoji` no se expone: la US solo pide un texto corto, así que esta
 * ruta nunca lo toca (queda como esté en el backend).
 */
export async function PUT(
  request: Request,
): Promise<NextResponse<UpdateCustomStatusActionResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: UNEXPECTED_ERROR_MESSAGE },
      { status: 400 },
    );
  }

  const statusText =
    typeof (body as { status_text?: unknown })?.status_text === "string"
      ? (body as { status_text: string }).status_text
      : "";

  const result = await updateStatus(session.token, { status_text: statusText });
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

export async function DELETE(): Promise<
  NextResponse<UpdateCustomStatusActionResult>
> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const result = await clearStatus(session.token);
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

  // `DELETE /v1/me/status` responde 204 sin body: el estado limpio se arma
  // localmente a partir de la sesión actual en vez de pedir el perfil de nuevo.
  const updatedUser = { ...session.user, status_text: "", status_emoji: "" };
  createSession({ ...session, user: updatedUser });

  return NextResponse.json({ ok: true, user: updatedUser }, { status: 200 });
}
