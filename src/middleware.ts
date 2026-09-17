import { NextResponse, type NextRequest } from "next/server";

import { ROUTES, SESSION_COOKIE } from "@/lib/constants";
import { parseSessionCookie } from "@/services/auth/session-shape";

/** Rutas que exigen sesion. Al crecer la app se agregan prefijos aca. */
const PROTECTED_PREFIXES = [ROUTES.home, ROUTES.invite];

/** Rutas solo para invitados: si ya hay sesion, se redirige a la home. */
const GUEST_ONLY = [
  ROUTES.login,
  ROUTES.register,
  ROUTES.forgotPassword,
  ROUTES.resetPassword,
];

/**
 * Guardia de rutas. Solo valida la FORMA de la cookie de sesion (es rapido,
 * sin red, y corre en cada request) -- la vigencia real del JWT la chequea el
 * servidor en `getValidSession()` cuando renderiza la pagina.
 *
 * Importante: no basta con mirar si la cookie existe (`.has(...)`). Si hay
 * una cookie corrupta o con forma vieja, `getSession()` en la pagina protegida
 * la trata como "sin sesion" y redirige a `/login`; si aca solo miramos
 * presencia, `/login` se ve con "sesion" (hasSession true) y rebota de vuelta
 * a la pagina protegida -- loop infinito entre ambas rutas. Validar la misma
 * forma en los dos lugares evita el desacuerdo.
 */
export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const cookieValue = request.cookies.get(SESSION_COOKIE)?.value;
  const hasSession = parseSessionCookie(cookieValue) !== null;
  const hasStaleCookie = cookieValue !== undefined && !hasSession;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  const isGuestOnly = GUEST_ONLY.includes(
    pathname as (typeof GUEST_ONLY)[number],
  );

  let response: NextResponse;

  if (isProtected && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.login;
    url.searchParams.set("next", pathname);
    response = NextResponse.redirect(url);
  } else if (isGuestOnly && hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.home;
    url.search = "";
    response = NextResponse.redirect(url);
  } else {
    response = NextResponse.next();
  }

  // Autolimpieza: una cookie que no parsea como sesion valida no sirve para
  // nada mas, y dejarla solo perpetua la ambiguedad en el proximo request.
  if (hasStaleCookie) response.cookies.delete(SESSION_COOKIE);

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
