import {
  hasErrors,
  TWO_FACTOR_DISABLE_UNAVAILABLE,
  TWO_FACTOR_NOT_ENABLED,
  TWO_FACTOR_PASSWORD_INVALID,
  type TwoFactorDisableResult,
  UNEXPECTED_ERROR_MESSAGE,
  validateTwoFactorPassword,
} from "@discordia/client-shared";

import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/api-route";
import { getValidSession } from "@/services/auth/session";
import { disableTwoFactor } from "@/services/two-factor/service";

/**
 * BFF de `POST /v1/me/2fa/disable` (CA5). Reingresar la contraseña es lo que
 * impide que una sesión abierta y ajena le saque el segundo factor a la
 * cuenta.
 */
export async function POST(
  request: Request,
): Promise<NextResponse<TwoFactorDisableResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

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
  const password = typeof body.password === "string" ? body.password : "";

  if (hasErrors(validateTwoFactorPassword({ password }))) {
    return NextResponse.json(
      { ok: false, message: TWO_FACTOR_PASSWORD_INVALID },
      { status: 400 },
    );
  }

  const result = await disableTwoFactor(session.token, password);
  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    // 403 y no 401: la contraseña está mal, pero la sesión sigue siendo buena.
    if (result.status === 403) {
      return NextResponse.json(
        { ok: false, message: TWO_FACTOR_PASSWORD_INVALID },
        { status: 403 },
      );
    }
    if (result.status === 409) {
      return NextResponse.json(
        { ok: false, message: TWO_FACTOR_NOT_ENABLED },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { ok: false, message: TWO_FACTOR_DISABLE_UNAVAILABLE },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
