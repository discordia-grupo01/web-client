import "server-only";

import { cookies } from "next/headers";

import { TWO_FACTOR_CHALLENGE_COOKIE } from "@/lib/constants";
import { isProduction } from "@/lib/env";

const CHALLENGE_MAX_AGE_SECONDS = 6 * 60;

export function setChallengeCookie(challengeToken: string): void {
  cookies().set(TWO_FACTOR_CHALLENGE_COOKIE, challengeToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: CHALLENGE_MAX_AGE_SECONDS,
  });
}

export function getChallengeToken(): string | null {
  return cookies().get(TWO_FACTOR_CHALLENGE_COOKIE)?.value ?? null;
}

export function clearChallengeCookie(): void {
  cookies().delete(TWO_FACTOR_CHALLENGE_COOKIE);
}
