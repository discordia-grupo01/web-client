import { REQUEST_FAILED_MESSAGE } from "@discordia/client-shared";
import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { getValidSession } from "@/services/auth/session";
import { createSocketTicket } from "@/services/messages/service";

/**
 * BFF que entrega un ticket de un solo uso (30 s) para abrir el WebSocket de
 * mensajes. El navegador no puede mandar headers en el handshake de un
 * WebSocket ni leer la cookie httpOnly, asi que el JWT no sirve de credencial
 * ahi: se canjea en el servidor por un ticket (`POST /v1/socket-tickets`) que
 * va en la URL (`?ticket=`) y que, si se filtra, ya esta gastado o vencido.
 * El JWT y el refresh token no salen nunca del servidor.
 *
 * Es un POST porque crea algo (un ticket nuevo en cada llamada).
 */
export async function POST(): Promise<
  NextResponse<{ ticket: string } | { ok: false; message: string }>
> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const result = await createSocketTicket(session.token);
  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    return NextResponse.json(
      { ok: false, message: REQUEST_FAILED_MESSAGE },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  return NextResponse.json(
    { ticket: result.data.ticket },
    { headers: { "Cache-Control": "no-store" } },
  );
}
