import {
  hasErrors,
  TWO_FACTOR_ACTIVATION_CODE_INVALID,
  TWO_FACTOR_ALREADY_ENABLED,
  TWO_FACTOR_SETUP_MISSING,
  TWO_FACTOR_SETUP_UNAVAILABLE,
  type TwoFactorRecoveryCodesResult,
  UNEXPECTED_ERROR_MESSAGE,
  validateTwoFactorActivationCode,
} from "@discordia/client-shared";

import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/api-route";
import { getValidSession } from "@/services/auth/session";
import { activateTwoFactor } from "@/services/two-factor/service";

/**
 * BFF de `POST /v1/me/2fa/activate` (CA1, segunda mitad): confirma el QR y
 * devuelve los códigos de recuperación. Es la única respuesta donde los
 * códigos viajan en claro.
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
  const code = typeof body.code === "string" ? body.code : "";

  if (hasErrors(validateTwoFactorActivationCode({ code }))) {
    return NextResponse.json(
      { ok: false, message: TWO_FACTOR_ACTIVATION_CODE_INVALID },
      { status: 400 },
    );
  }

  const result = await activateTwoFactor(session.token, code.trim());
  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    if (result.status === 400) {
      return NextResponse.json(
        { ok: false, message: TWO_FACTOR_ACTIVATION_CODE_INVALID },
        { status: 400 },
      );
    }
    if (result.status === 409) {
      // Los dos 409 posibles se distinguen por el código simbólico: rehacer el
      // QR y "ya estaba activo" piden acciones opuestas al usuario.
      return NextResponse.json(
        {
          ok: false,
          message:
            result.code === "TWO_FACTOR_ALREADY_ENABLED"
              ? TWO_FACTOR_ALREADY_ENABLED
              : TWO_FACTOR_SETUP_MISSING,
        },
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
