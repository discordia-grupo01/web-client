import { NextResponse } from "next/server";

import { loginWithGoogle } from "@/services/auth/service";
import { createSession } from "@/services/auth/session";
import type { LoginActionResult } from "@/types/auth.types";

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
  const idToken = typeof body.idToken === "string" ? body.idToken : "";

  if (!idToken) {
    return NextResponse.json(
      { ok: false, message: "Revisa los datos ingresados." },
      { status: 400 },
    );
  }

  const { result, refreshToken } = await loginWithGoogle(idToken);

  if (!result.ok) {
    // Google no responde (CA3): dejamos visible la alternativa de email/contrasena.
    if (result.status === 503 || result.code === "OAUTH_PROVIDER_UNAVAILABLE") {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Google no está disponible en este momento. Inicia sesión con tu correo y contraseña.",
        },
        { status: 503 },
      );
    }

    // Token invalido o no verificable por Google.
    if (result.status === 401) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "No pudimos verificar tu cuenta de Google. Inicia sesión con tu correo y contraseña.",
        },
        { status: 401 },
      );
    }

    // 400: falta id_token o el backend rechazo el formato del request.
    if (result.status === 400) {
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
