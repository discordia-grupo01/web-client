import { NextResponse } from "next/server";

import { confirmEmail } from "@/services/auth/service";
import type { EmailConfirmationResult } from "@/types/auth.types";

export async function POST(
  request: Request,
): Promise<NextResponse<EmailConfirmationResult>> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Formato de petición inválido." },
      { status: 400 },
    );
  }

  const body = (payload ?? {}) as Record<string, unknown>;
  const token = typeof body.token === "string" ? body.token : "";
  if (!token) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "El enlace de confirmación no es válido o expiró. Solicita uno nuevo.",
      },
      { status: 400 },
    );
  }

  const result = await confirmEmail(token);
  if (!result.ok) {
    if (result.code === "INVALID_EMAIL_CONFIRMATION") {
      return NextResponse.json(
        {
          ok: false,
          message:
            "El enlace de confirmación no es válido o expiró. Solicita uno nuevo.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        message: "No pudimos confirmar tu correo. Intenta nuevamente.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
