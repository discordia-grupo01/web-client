import {
  TWO_FACTOR_ALREADY_ENABLED,
  TWO_FACTOR_SETUP_UNAVAILABLE,
  type TwoFactorSetupResult,
} from "@discordia/client-shared";

import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/api-route";
import { getValidSession } from "@/services/auth/session";
import { startTwoFactorSetup } from "@/services/two-factor/service";

/**
 * BFF de `POST /v1/me/2fa/setup` (CA1, primera mitad): devuelve el secreto y
 * la URI `otpauth://` para dibujar el QR. No activa nada todavía.
 */
export async function POST(): Promise<NextResponse<TwoFactorSetupResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const result = await startTwoFactorSetup(session.token);
  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    if (result.status === 409) {
      return NextResponse.json(
        { ok: false, message: TWO_FACTOR_ALREADY_ENABLED },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { ok: false, message: TWO_FACTOR_SETUP_UNAVAILABLE },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, setup: result.data }, { status: 200 });
}
