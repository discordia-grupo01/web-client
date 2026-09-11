import "server-only";

import { cookies } from "next/headers";

import { SESSION_COOKIE } from "@/lib/constants";
import { isProduction } from "@/lib/env";

import type { Session, User } from "./types";

const DEFAULT_MAX_AGE_SECONDS = 72 * 60 * 60; // el JWT del backend dura 72h

/**
 * Escribe la sesion en una cookie httpOnly. El JS del navegador no puede leerla
 * (mitiga XSS); solo el servidor de Next la ve. Se llama unicamente desde Route
 * Handlers o Server Actions.
 */
export function createSession(session: Session): void {
  cookies().set(SESSION_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: secondsUntilExpiry(session.token) ?? DEFAULT_MAX_AGE_SECONDS,
  });
}

export function destroySession(): void {
  cookies().delete(SESSION_COOKIE);
}

/**
 * Lee y valida la sesion. Devuelve `null` si no hay cookie, si esta corrupta
 * o si el JWT ya expiro. Seguro de usar en Server Components.
 */
export function getSession(): Session | null {
  const cookie = cookies().get(SESSION_COOKIE)?.value;
  if (!cookie) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(cookie);
  } catch {
    return null;
  }

  if (!isSession(parsed)) return null;
  if (isExpired(parsed.token)) return null;

  return parsed;
}

export function getCurrentUser(): User | null {
  return getSession()?.user ?? null;
}

function isSession(value: unknown): value is Session {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  const user = candidate.user as Record<string, unknown> | undefined;
  return (
    typeof candidate.token === "string" &&
    typeof user === "object" &&
    user !== null &&
    typeof user.id === "number" &&
    typeof user.email === "string" &&
    typeof user.name === "string"
  );
}

interface JwtPayload {
  exp?: number;
}

function decodeJwtPayload(token: string): JwtPayload | null {
  const segments = token.split(".");
  if (segments.length !== 3) return null;
  try {
    const json = Buffer.from(segments[1], "base64url").toString("utf8");
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

function isExpired(token: string): boolean {
  const exp = decodeJwtPayload(token)?.exp;
  if (typeof exp !== "number") return false; // sin exp legible, delega en el backend
  return exp * 1000 <= Date.now();
}

function secondsUntilExpiry(token: string): number | null {
  const exp = decodeJwtPayload(token)?.exp;
  if (typeof exp !== "number") return null;
  const seconds = Math.floor(exp - Date.now() / 1000);
  return seconds > 0 ? seconds : null;
}
