import {
  hasErrors,
  TWO_FACTOR_NOT_ENABLED,
  TWO_FACTOR_PASSWORD_INVALID,
  TWO_FACTOR_SETUP_UNAVAILABLE,
  type TwoFactorRecoveryCodesResult,
  UNEXPECTED_ERROR_MESSAGE,
  validateTwoFactorPassword,
} from "@discordia/client-shared";

import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/api-route";
import { getValidSession } from "@/services/auth/session";
import { regenerateRecoveryCodes } from "@/services/two-factor/service";

/**
 * BFF de `POST /v1/me/2fa/recovery-codes` (CA4): entrega una lista nueva e
 * invalida la anterior completa. Es lo que se le ofrece al usuario después de
 * gastar un código.
 */
export async function POST(
  request: Request,
): Promise<NextResponse<TwoFactorRecoveryCodesResult>> {
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

  const result = await regenerateRecoveryCodes(session.token, password);
  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }
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
      { ok: false, message: TWO_FACTOR_SETUP_UNAVAILABLE },
      { status: 502 },
    );
  }

  return NextResponse.json(
    { ok: true, recoveryCodes: result.data.recovery_codes },
    { status: 200 },
  );
}
