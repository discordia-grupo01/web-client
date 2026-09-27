import {
  TWO_FACTOR_SETUP_UNAVAILABLE,
  type TwoFactorStatusResult,
} from "@discordia/client-shared";

import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/api-route";
import { getValidSession } from "@/services/auth/session";
import { getTwoFactorStatus } from "@/services/two-factor/service";

/** BFF de `GET /v1/me/2fa`: si la cuenta tiene segundo factor y cuántos códigos le quedan. */
export async function GET(): Promise<NextResponse<TwoFactorStatusResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const result = await getTwoFactorStatus(session.token);
  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    return NextResponse.json(
      { ok: false, message: TWO_FACTOR_SETUP_UNAVAILABLE },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, status: result.data }, { status: 200 });
}
