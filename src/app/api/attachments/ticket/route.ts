import { ATTACHMENT_UPLOAD_FAILED } from "@discordia/client-shared";
import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { getValidSession } from "@/services/auth/session";
import { createAttachmentTicket } from "@/services/attachments/service";

/**
 * BFF que canjea el JWT de la sesion por un ticket de un solo uso (60 s) para
 * subir un adjunto. El archivo no pasa por aca: Vercel corta los pedidos a sus
 * funciones en 4,5 MB, asi que el navegador lo sube directo al gateway con el
 * ticket. El JWT y el refresh token no salen nunca del servidor.
 */
export async function POST(): Promise<
  NextResponse<{ ticket: string } | { ok: false; message: string }>
> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const result = await createAttachmentTicket(session.token);
  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    return NextResponse.json(
      { ok: false, message: ATTACHMENT_UPLOAD_FAILED },
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
