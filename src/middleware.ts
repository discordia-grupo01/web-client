import { NextResponse, type NextRequest } from "next/server";

import { ROUTES, SESSION_COOKIE } from "@/lib/constants";

/** Rutas que exigen sesion. Al crecer la app se agregan prefijos aca. */
const PROTECTED_PREFIXES = [ROUTES.home];

/** Rutas solo para invitados: si ya hay sesion, se redirige a la home. */
const GUEST_ONLY = [
  ROUTES.login,
  ROUTES.register,
  ROUTES.forgotPassword,
  ROUTES.resetPassword,
];

/**
 * Guardia de rutas. Solo mira la PRESENCIA de la cookie de sesion (es rapido y
 * corre en cada request). La validez real del JWT la chequea el servidor en
 * `getSession()` cuando renderiza la pagina.
 */
export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE);

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  const isGuestOnly = GUEST_ONLY.includes(
    pathname as (typeof GUEST_ONLY)[number],
  );

  if (isProtected && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.login;
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isGuestOnly && hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.home;
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
