import { NextResponse } from "next/server";

import { login } from "@/services/auth/service";
import { createSession } from "@/services/auth/session";
import type { LoginActionResult } from "@/types/auth.types";
import { hasErrors, validateLogin } from "@/services/auth/validation";

export async function POST(
  request: Request,
): Promise<NextResponse<LoginActionResult>> {
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
  const password = typeof body.password === "string" ? body.password : "";

  if (hasErrors(validateLogin({ email, password }))) {
    return NextResponse.json(
      { ok: false, message: "Revisa los datos ingresados." },
      { status: 400 },
    );
  }

  const { result, refreshToken } = await login({
    email: email.trim(),
    password,
  });

  if (!result.ok) {
    // 401: credenciales invalidas. Mensaje generico, sin distinguir campo.
    if (result.status === 401) {
      return NextResponse.json(
        {
          ok: false,
          message: "El correo electrónico o la contraseña son incorrectos.",
        },
        { status: 401 },
      );
    }

    // 400/422: el backend rechazo el formato del request.
    if (result.status === 400 || result.status === 422) {
      return NextResponse.json(
        { ok: false, message: "Revisa los datos ingresados." },
        { status: 400 },
      );
    }

    // Red caida, timeout o error del backend (5xx, 404, ...): servicio no disponible.
    return NextResponse.json(
      {
        ok: false,
        message:
          "No pudimos iniciar sesión en este momento. Intenta de nuevo más tarde.",
      },
      { status: 502 },
    );
  }

  createSession({
    token: result.data.token,
    refreshToken: refreshToken ?? "",
    user: result.data.user,
  });

  return NextResponse.json(
    { ok: true, user: result.data.user },
    { status: 200 },
  );
}
