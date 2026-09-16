import { NextResponse } from "next/server";

import { logout } from "@/services/auth/service";
import { destroySession, getSession } from "@/services/auth/session";

/**
 * BFF de logout. Revoca la sesion en el backend (best effort) y borra la cookie.
 * Siempre responde 204: aunque el backend falle, localmente la sesion se cierra.
 */
export async function POST(): Promise<NextResponse> {
  const session = getSession();

  if (session) {
    await logout(session.token);
  }

  destroySession();

  return new NextResponse(null, { status: 204 });
}
