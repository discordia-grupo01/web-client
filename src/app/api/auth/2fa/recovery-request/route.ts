import {
  ACCOUNT_RECOVERY_CHALLENGE_EXPIRED,
  ACCOUNT_RECOVERY_UNAVAILABLE,
  ACCOUNT_SUSPENDED_MESSAGE,
  type AccountRecoveryResult,
  hasErrors,
  UNEXPECTED_ERROR_MESSAGE,
  validateAccountRecovery,
} from "@discordia/client-shared";

import { NextResponse } from "next/server";

import {
  clearChallengeCookie,
  getChallengeToken,
} from "@/services/two-factor/challenge-cookie";
import { requestAccountRecovery } from "@/services/two-factor/service";

export async function POST(
  request: Request,
): Promise<NextResponse<AccountRecoveryResult>> {
  const challengeToken = getChallengeToken();
  if (!challengeToken) {
    return NextResponse.json(
      { ok: false, message: ACCOUNT_RECOVERY_CHALLENGE_EXPIRED, expired: true },
      { status: 401 },
    );
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
  const message = typeof body.message === "string" ? body.message.trim() : "";

  const errors = validateAccountRecovery({ message });
  if (hasErrors(errors)) {
    return NextResponse.json(
      { ok: false, message: errors.message ?? UNEXPECTED_ERROR_MESSAGE },
      { status: 400 },
    );
  }

  // El challenge no se borra al crear la solicitud: el back no lo consume y
  // el usuario todavía puede volver a la verificación y usarlo.
  const result = await requestAccountRecovery({
    challenge_token: challengeToken,
    message,
  });

  if (result.ok) {
    return NextResponse.json(
      { ok: true, emailHint: result.data.email_hint },
      { status: 201 },
    );
  }

  if (result.status === 409) {
    return NextResponse.json(
      { ok: true, alreadyPending: true },
      { status: 200 },
    );
  }

  if (result.status === 401) {
    clearChallengeCookie();
    return NextResponse.json(
      { ok: false, message: ACCOUNT_RECOVERY_CHALLENGE_EXPIRED, expired: true },
      { status: 401 },
    );
  }

  if (result.status === 403) {
    return NextResponse.json(
      { ok: false, message: ACCOUNT_SUSPENDED_MESSAGE },
      { status: 403 },
    );
  }

  return NextResponse.json(
    { ok: false, message: ACCOUNT_RECOVERY_UNAVAILABLE },
    { status: 502 },
  );
}
