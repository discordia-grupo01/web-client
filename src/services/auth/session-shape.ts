import type { Session } from "@/types/auth.types";

/**
 * Parsea y valida la forma de la cookie de sesion, sin depender de
 * `next/headers` ni de `server-only`: la usan tanto `session.ts` (Route
 * Handlers/Server Components) como `middleware.ts` (Edge Runtime, que lee la
 * cookie via `NextRequest.cookies` en vez de `cookies()`).
 *
 * Solo valida forma, no vigencia del JWT (eso es trabajo de
 * `getValidSession`). Sirve para que ambos lugares coincidan en que cuenta
 * como "sesion presente" y evitar el loop de redirects que pasaba cuando el
 * middleware trataba una cookie corrupta como sesion valida.
 */
export function parseSessionCookie(raw: string | undefined): Session | null {
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  return isSession(parsed) ? parsed : null;
}

function isSession(value: unknown): value is Session {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  const user = candidate.user as Record<string, unknown> | undefined;
  return (
    typeof candidate.token === "string" &&
    typeof candidate.refreshToken === "string" &&
    typeof user === "object" &&
    user !== null &&
    typeof user.id === "string" &&
    typeof user.email === "string" &&
    typeof user.name === "string"
  );
}
