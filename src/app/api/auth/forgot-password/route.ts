import {
  hasErrors,
  INVALID_EMAIL_MESSAGE,
  RATE_LIMITED_MESSAGE,
  RECOVERY_UNAVAILABLE,
  UNEXPECTED_ERROR_MESSAGE,
  validateForgotPassword,
} from "@discordia/client-shared";

import { NextResponse } from "next/server";

import { recoverPassword } from "@/services/auth/service";
import type { ForgotPasswordActionResult } from "@/types/auth.types";

/**
 * BFF de recuperacion de contrasena. El backend responde 202 exista o no el
 * correo (para no permitir enumerar cuentas registradas); este handler
 * preserva esa ambiguedad y solo distingue errores de formato o rate limit.
 */
export async function POST(
  request: Request,
): Promise<NextResponse<ForgotPasswordActionResult>> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: UNEXPECTED_ERROR_MESSAGE },
      { status: 400 },
    );
  }

  const body = (payload ?? {}) as Record<string, unknown>;
  const email = typeof body.email === "string" ? body.email : "";

  if (hasErrors(validateForgotPassword({ email }))) {
    return NextResponse.json(
      { ok: false, message: INVALID_EMAIL_MESSAGE },
      { status: 400 },
    );
  }

  const result = await recoverPassword(email.trim());

  if (!result.ok) {
    switch (result.code) {
      case "RECOVERY_RATE_LIMITED":
        return NextResponse.json(
          {
            ok: false,
            message: RATE_LIMITED_MESSAGE,
          },
          { status: 429 },
        );

      case "INVALID_INPUT":
        return NextResponse.json(
          { ok: false, message: INVALID_EMAIL_MESSAGE },
          { status: 400 },
        );

      default:
        // Red caida, timeout o error del backend (5xx, ...): servicio no disponible.
        return NextResponse.json(
          {
            ok: false,
            message: RECOVERY_UNAVAILABLE,
          },
          { status: 502 },
        );
    }
  }

  return NextResponse.json({ ok: true }, { status: 202 });
}
