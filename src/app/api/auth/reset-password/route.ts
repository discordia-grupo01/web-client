import {
  hasErrors,
  INVALID_DATA_MESSAGE,
  PASSWORD_TOO_WEAK,
  PASSWORD_UPDATE_UNAVAILABLE,
  type ResetPasswordResult,
  UNEXPECTED_ERROR_MESSAGE,
  validateResetPassword,
} from "@discordia/client-shared";

import { NextResponse } from "next/server";

import { resetPassword } from "@/services/auth/service";

/**
 * BFF para definir la nueva contrasena. A diferencia de login/register no crea
 * sesion: `POST /v1/password-reset` no devuelve token, asi que el usuario
 * vuelve a iniciar sesion con la contrasena nueva.
 */
export async function POST(
  request: Request,
): Promise<NextResponse<ResetPasswordResult>> {
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
          "El enlace de recuperación no es válido o expiró. Solicita uno nuevo.",
      },
      { status: 400 },
    );
  }

  if (hasErrors(validateResetPassword({ newPassword, confirmPassword }))) {
    return NextResponse.json(
      { ok: false, message: INVALID_DATA_MESSAGE },
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
            message: PASSWORD_TOO_WEAK,
          },
          { status: 400 },
        );

      default:
        // Red caida, timeout o error del backend (5xx, ...): servicio no disponible.
        return NextResponse.json(
          {
            ok: false,
            message: PASSWORD_UPDATE_UNAVAILABLE,
          },
          { status: 502 },
        );
    }
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
