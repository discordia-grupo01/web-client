import {
  hasErrors,
  TWO_FACTOR_CHALLENGE_EXPIRED,
  TWO_FACTOR_CODE_INVALID,
  TWO_FACTOR_TOO_MANY_ATTEMPTS,
  TWO_FACTOR_UNAVAILABLE,
  type TwoFactorVerifyResult,
  UNEXPECTED_ERROR_MESSAGE,
  validateTwoFactorCode,
} from "@discordia/client-shared";

import { NextResponse } from "next/server";

import { createSession } from "@/services/auth/session";
import {
  clearChallengeCookie,
  getChallengeToken,
} from "@/services/two-factor/challenge-cookie";
import { verifyTwoFactorLogin } from "@/services/two-factor/service";

export async function POST(
  request: Request,
): Promise<NextResponse<TwoFactorVerifyResult>> {
  const challengeToken = getChallengeToken();
  if (!challengeToken) {
    return NextResponse.json(
      { ok: false, message: TWO_FACTOR_CHALLENGE_EXPIRED, expired: true },
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
  const code = typeof body.code === "string" ? body.code : "";

  if (hasErrors(validateTwoFactorCode({ code }))) {
    return NextResponse.json(
      { ok: false, message: TWO_FACTOR_CODE_INVALID },
      { status: 400 },
    );
  }

  const { result, refreshToken } = await verifyTwoFactorLogin({
    challenge_token: challengeToken,
    code: code.trim(),
  });

  if (!result.ok) {
    if (result.status === 401 && result.code === "INVALID_TWO_FACTOR_CODE") {
      return NextResponse.json(
        { ok: false, message: TWO_FACTOR_CODE_INVALID },
        { status: 401 },
      );
    }

    if (result.status === 429) {
      clearChallengeCookie();
      return NextResponse.json(
        { ok: false, message: TWO_FACTOR_TOO_MANY_ATTEMPTS, expired: true },
        { status: 429 },
      );
    }
    if (result.status === 401) {
      clearChallengeCookie();
      return NextResponse.json(
        { ok: false, message: TWO_FACTOR_CHALLENGE_EXPIRED, expired: true },
        { status: 401 },
      );
    }

    if (result.status === 400 || result.status === 422) {
      return NextResponse.json(
        { ok: false, message: TWO_FACTOR_CODE_INVALID },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { ok: false, message: TWO_FACTOR_UNAVAILABLE },
      { status: 502 },
    );
  }

  clearChallengeCookie();
  createSession({
    token: result.data.token,
    refreshToken: refreshToken ?? "",
    user: result.data.user,
  });

  return NextResponse.json(
    {
      ok: true,
      user: result.data.user,
      recoveryCodeUsed: result.data.recovery_code_used ?? false,
      recoveryCodesRemaining: result.data.recovery_codes_remaining ?? 0,
    },
    { status: 200 },
  );
}
