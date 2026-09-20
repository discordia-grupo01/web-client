import {
  hasErrors,
  INVALID_CREDENTIALS,
  INVALID_DATA_MESSAGE,
  LOGIN_UNAVAILABLE,
  UNEXPECTED_ERROR_MESSAGE,
  validateLogin,
} from "@discordia/client-shared";

import { NextResponse } from "next/server";

import { login } from "@/services/auth/service";
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
  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (hasErrors(validateLogin({ email, password }))) {
    return NextResponse.json(
      { ok: false, message: INVALID_DATA_MESSAGE },
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
          message: INVALID_CREDENTIALS,
        },
        { status: 401 },
      );
    }

    // 400/422: el backend rechazo el formato del request.
    if (result.status === 400 || result.status === 422) {
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
