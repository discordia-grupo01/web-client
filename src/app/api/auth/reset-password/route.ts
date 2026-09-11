import { NextResponse } from "next/server";

import { resetPassword } from "@/features/auth/service";
import type { ResetPasswordActionResult } from "@/features/auth/types";
import { hasErrors, validateResetPassword } from "@/features/auth/validation";

/**
 * BFF para definir la nueva contrasena. A diferencia de login/register no crea
 * sesion: `POST /v1/password-reset` no devuelve token, asi que el usuario
 * vuelve a iniciar sesion con la contrasena nueva.
 */
export async function POST(
  request: Request,
): Promise<NextResponse<ResetPasswordActionResult>> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Peticion invalida." },
      { status: 400 },
    );
  }

  const body = (payload ?? {}) as Record<string, unknown>;
  const token = typeof body.token === "string" ? body.token : "";
  const newPassword =
    typeof body.newPassword === "string" ? body.newPassword : "";
  const confirmPassword =
    typeof body.confirmPassword === "string" ? body.confirmPassword : "";

  if (token === "") {
    return NextResponse.json(
      {
        ok: false,
        message:
          "El enlace de recuperacion no es valido o expiro. Solicita uno nuevo.",
      },
      { status: 400 },
    );
  }

  if (hasErrors(validateResetPassword({ newPassword, confirmPassword }))) {
    return NextResponse.json(
      { ok: false, message: "Revisa los datos ingresados." },
      { status: 400 },
    );
  }

  const result = await resetPassword({
    token,
    new_password: newPassword,
    confirm_password: confirmPassword,
  });

  if (!result.ok) {
    switch (result.code) {
      case "INVALID_RESET_TOKEN":
      case "PASSWORDS_DO_NOT_MATCH":
        return NextResponse.json(
          { ok: false, message: result.message },
          { status: 400 },
        );

      case "INSECURE_PASSWORD":
        return NextResponse.json(
          {
            ok: false,
            message:
              "Revisa los datos: la contrasena necesita 8+ caracteres con mayuscula, minuscula y numero.",
          },
          { status: 400 },
        );

      default:
        // Red caida, timeout o error del backend (5xx, ...): servicio no disponible.
        return NextResponse.json(
          {
            ok: false,
            message:
              "No pudimos actualizar tu contrasena en este momento. Intenta de nuevo mas tarde.",
          },
          { status: 502 },
        );
    }
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
