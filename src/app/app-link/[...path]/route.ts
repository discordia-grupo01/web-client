import { NextResponse } from "next/server";

import {
  buildAppLinkTargets,
  deviceFromUserAgent,
  isAppLinkPath,
  renderAppLinkPage,
} from "./appLink";

/**
 * GET /app-link/<destino>?<query>: abre la app mobile en `discordia://<destino>`.
 * Pública a propósito: la usan la vuelta de Mercado Pago y el link del mail de
 * confirmación, que se abren en un navegador sin sesión. En una computadora va
 * directo a la página web equivalente.
 */
export function GET(
  request: Request,
  { params }: { params: { path: string[] } },
): Response {
  const target = params.path.join("/");
  if (!isAppLinkPath(target)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const url = new URL(request.url);
  const targets = buildAppLinkTargets(target, url.search, url.origin);
  const device = deviceFromUserAgent(request.headers.get("user-agent"));

  if (device === "desktop") {
    return NextResponse.redirect(targets.webUrl, 302);
  }
  return new NextResponse(renderAppLinkPage(targets, device), {
    headers: {
      "content-type": "text/html; charset=utf-8",
      // El query puede traer el token del mail: que no quede en caches ni se
      // mande como referer a otro sitio.
      "cache-control": "no-store",
      "referrer-policy": "no-referrer",
    },
  });
}
