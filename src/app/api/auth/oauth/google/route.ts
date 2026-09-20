import {
  GOOGLE_UNAVAILABLE,
  GOOGLE_VERIFY_FAILED,
  INVALID_DATA_MESSAGE,
  LOGIN_UNAVAILABLE,
  UNEXPECTED_ERROR_MESSAGE,
} from "@discordia/client-shared";

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
      { ok: false, message: UNEXPECTED_ERROR_MESSAGE },
      { status: 400 },
    );
  }

  const body = (payload ?? {}) as Record<string, unknown>;
  const idToken = typeof body.idToken === "string" ? body.idToken : "";

  if (!idToken) {
    return NextResponse.json(
      { ok: false, message: INVALID_DATA_MESSAGE },
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
          message: GOOGLE_UNAVAILABLE,
        },
        { status: 503 },
      );
    }

    // Token invalido o no verificable por Google.
    if (result.status === 401) {
      return NextResponse.json(
        {
          ok: false,
          message: GOOGLE_VERIFY_FAILED,
        },
        { status: 401 },
      );
    }

    // 400: falta id_token o el backend rechazo el formato del request.
    if (result.status === 400) {
      return NextResponse.json(
        { ok: false, message: INVALID_DATA_MESSAGE },
        { status: 400 },
      );
    }

    // Red caida, timeout o error del backend (5xx, 404, ...): servicio no disponible.
    return NextResponse.json(
      {
        ok: false,
        message: LOGIN_UNAVAILABLE,
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
