import { NextResponse } from "next/server";

import { recoverPassword } from "@/features/auth/service";
import type { ForgotPasswordActionResult } from "@/features/auth/types";
import { hasErrors, validateForgotPassword } from "@/features/auth/validation";

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
      { ok: false, message: "Petición inválida." },
      { status: 400 },
    );
  }

  const body = (payload ?? {}) as Record<string, unknown>;
  const email = typeof body.email === "string" ? body.email : "";

  if (hasErrors(validateForgotPassword({ email }))) {
    return NextResponse.json(
      { ok: false, message: "Ingresa un correo electrónico válido." },
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
            message:
              "Alcanzaste el límite de solicitudes. Intenta de nuevo más tarde.",
          },
          { status: 429 },
        );

      case "INVALID_INPUT":
        return NextResponse.json(
          { ok: false, message: "Ingresa un correo electrónico válido." },
          { status: 400 },
        );

      default:
        // Red caida, timeout o error del backend (5xx, ...): servicio no disponible.
        return NextResponse.json(
          {
            ok: false,
            message:
              "No pudimos procesar la solicitud. Intenta de nuevo más tarde.",
          },
          { status: 502 },
        );
    }
  }

  return NextResponse.json({ ok: true }, { status: 202 });
}
