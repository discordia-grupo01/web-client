import {
  EMAIL_ALREADY_REGISTERED,
  INVALID_DATA_MESSAGE,
  PASSWORD_TOO_WEAK,
  REGISTER_UNAVAILABLE,
  UNEXPECTED_ERROR_MESSAGE,
} from "@discordia/client-shared";

import { NextResponse } from "next/server";

import { register } from "@/services/auth/service";
import type { RegisterActionResult } from "@/types/auth.types";
import { hasErrors, validateRegister } from "@/services/auth/validation";

/**
 * BFF de registro. El navegador pega aca (mismo origen); este handler llama a
 * `POST /v1/users` de identify-service. Esa respuesta YA NO trae un token
 * (identify-service dejo de generarlo al registrarse): no se crea sesion
 * aca, el usuario tiene que loguearse aparte despues de crear la cuenta.
 */
export async function POST(
  request: Request,
): Promise<NextResponse<RegisterActionResult>> {
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
  const name = typeof body.name === "string" ? body.name : "";
  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (hasErrors(validateRegister({ name, email, password }))) {
    return NextResponse.json(
      { ok: false, message: INVALID_DATA_MESSAGE },
      { status: 400 },
    );
  }

  const result = await register({
    name: name.trim(),
    email: email.trim(),
    password,
  });

  if (!result.ok) {
    // 409: ya existe una cuenta con ese correo.
    if (result.status === 409) {
      return NextResponse.json(
        {
          ok: false,
          message: EMAIL_ALREADY_REGISTERED,
        },
        { status: 409 },
      );
    }

    // 400/422: datos invalidos o contrasena insegura (el backend es la autoridad).
    if (result.status === 400 || result.status === 422) {
      return NextResponse.json(
        {
          ok: false,
          message: PASSWORD_TOO_WEAK,
        },
        { status: 400 },
      );
    }

    // Red caida, timeout o error del backend (5xx, 404, ...): servicio no disponible.
    return NextResponse.json(
      {
        ok: false,
        message: REGISTER_UNAVAILABLE,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
