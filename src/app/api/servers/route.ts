import { NextResponse } from "next/server";

import { getSession } from "@/services/auth/session";
import { createServer, listMyServers } from "@/services/servers/service";
import type { CreateServerActionResult } from "@/services/servers/types";

/** Traduce `details.reason` del back a un mensaje de campo en español. */
const REASON_MESSAGES: Record<string, string> = {
  name_required: "Ingresá un nombre para el servidor.",
  name_too_short: "El nombre debe tener entre 2 y 100 caracteres.",
  name_too_long: "El nombre debe tener entre 2 y 100 caracteres.",
  name_invalid_chars: "El nombre contiene caracteres no permitidos.",
  name_taken: "Ya tenés un servidor con ese nombre.",
  icon_too_large: "El archivo no puede pesar más de 20 MB.",
  icon_unsupported_type: "El archivo debe ser PNG, JPG o WEBP.",
  icon_unreadable: "No pudimos leer ese archivo. Probá con otro.",
};

const SESSION_EXPIRED = "Tu sesión expiró. Volvé a iniciar sesión.";

/**
 * BFF de `GET /v1/servers`. El navegador pega aca (mismo origen); reenvia el
 * JWT de la cookie httpOnly, nunca lo expone.
 */
export async function GET(): Promise<NextResponse> {
  const session = getSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, message: SESSION_EXPIRED },
      { status: 401 },
    );
  }

  const result = await listMyServers(session.token);
  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: "No pudimos cargar tus servidores. Intenta de nuevo.",
      },
      { status: result.status || 502 },
    );
  }

  return NextResponse.json({ ok: true, servers: result.data }, { status: 200 });
}

/**
 * BFF de `POST /v1/servers`. Recibe el FormData tal cual llega del navegador
 * (multipart/form-data: name + icon opcional) y lo reenvia al servicio.
 */
export async function POST(
  request: Request,
): Promise<NextResponse<CreateServerActionResult>> {
  const session = getSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, message: SESSION_EXPIRED },
      { status: 401 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Peticion invalida." },
      { status: 400 },
    );
  }

  const result = await createServer(session.token, formData);

  if (!result.ok) {
    const field =
      typeof result.details?.field === "string"
        ? result.details.field
        : undefined;
    const reason =
      typeof result.details?.reason === "string"
        ? result.details.reason
        : undefined;
    const friendly = reason ? REASON_MESSAGES[reason] : undefined;

    if ((field === "name" || field === "icon") && friendly) {
      return NextResponse.json(
        { ok: false, message: friendly, fieldErrors: { [field]: friendly } },
        { status: result.status || 400 },
      );
    }

    if (result.status === 401) {
      return NextResponse.json(
        { ok: false, message: SESSION_EXPIRED },
        { status: 401 },
      );
    }

    return NextResponse.json(
      { ok: false, message: "Algo salio mal. Intenta de nuevo." },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  return NextResponse.json({ ok: true, server: result.data }, { status: 201 });
}
