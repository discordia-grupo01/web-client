import "server-only";

import { cookies } from "next/headers";

import { SESSION_COOKIE } from "@/lib/constants";
import { isProduction } from "@/lib/env";
import { refresh } from "@/services/auth/service";
import { parseSessionCookie } from "@/services/auth/session-shape";

import type { Session, User } from "@/types/auth.types";

// Margen de seguridad: si al access token le quedan menos de esto, se
// refresca antes de usarlo (cubre la latencia entre este chequeo y el
// momento real en que identify-service recibe la request).
const REFRESH_SKEW_SECONDS = 30;

// El refresh token de identify-service dura 30 dias (RefreshTokenTTL); la
// cookie de sesion tiene que sobrevivir al menos eso, no los 15min del access
// token (que se renueva solo via refresh mientras el refresh token siga vivo).
const DEFAULT_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

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
    maxAge: DEFAULT_MAX_AGE_SECONDS,
  });
}

export function destroySession(): void {
  cookies().delete(SESSION_COOKIE);
}

/**
 * Lee la sesion tal cual esta en la cookie. Devuelve `null` si no hay cookie
 * o si esta corrupta. No valida si el access token sigue vigente -- para eso
 * esta `getValidSession`. Sirve para chequeos rapidos sin red (`middleware.ts`,
 * mostrar el usuario en un Server Component) y para leer el `refreshToken`
 * antes de pegarle al backend en logout.
 */
export function getSession(): Session | null {
  return parseSessionCookie(cookies().get(SESSION_COOKIE)?.value);
}

/**
 * Como `getSession`, pero garantiza que el access token devuelto sirva para
 * pegarle a identify-service: si esta vencido (o por vencer) lo refresca via
 * /v1/refresh, reescribe la cookie y devuelve la sesion nueva. Si el refresh
 * falla (refresh token vencido, invalido o reutilizado), borra la sesion y
 * devuelve `null`.
 *
 * Solo se puede llamar desde Route Handlers o Server Actions: si refresca,
 * necesita reescribir la cookie de sesion (`cookies().set(...)`), algo que
 * Next no permite hacer desde un Server Component en render.
 */
export async function getValidSession(): Promise<Session | null> {
  const session = getSession();
  if (!session) return null;

  const exp = decodeJwtPayload(session.token)?.exp;
  const stillValid = typeof exp === "number" && exp - REFRESH_SKEW_SECONDS > Date.now() / 1000;
  if (stillValid) return session;

  const { result, newRefreshToken } = await refresh(session.refreshToken);
  if (!result.ok) {
    destroySession();
    return null;
  }

  const newSession: Session = {
    token: result.data.token,
    refreshToken: newRefreshToken ?? session.refreshToken,
    user: result.data.user,
  };
  createSession(newSession);
  return newSession;
}

export function getCurrentUser(): User | null {
  return getSession()?.user ?? null;
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
