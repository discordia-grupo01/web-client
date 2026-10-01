import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { getValidSession } from "@/services/auth/session";

/**
 * BFF que entrega el access token (~15 min) para abrir el WebSocket de
 * mensajes. Es la unica excepcion a "el navegador nunca ve un token": el
 * handshake del WebSocket no admite headers ni la cookie httpOnly llega al
 * gateway, y messaging solo autentica con `?token=`. El refresh token no sale
 * nunca del servidor.
 *
 * `getValidSession` refresca el token si esta por vencer, asi que lo que se
 * devuelve siempre tiene vigencia por delante.
 */
export async function GET(): Promise<
  NextResponse<{ token: string } | { ok: false; message: string }>
> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  return NextResponse.json(
    { token: session.token },
    { headers: { "Cache-Control": "no-store" } },
  );
}
