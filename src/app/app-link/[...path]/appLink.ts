import { ROUTES } from "@/lib/constants";

/**
 * Página puente entre un link https (de un mail o de la vuelta de Mercado
 * Pago) y la app mobile. Ni los clientes de correo ni Mercado Pago aceptan
 * links `discordia://`, así que apuntan acá y esta página abre la app.
 *
 * Solo abre los destinos de esta lista, para que no sirva de redirección
 * abierta. Cada uno tiene su página web equivalente para cuando la app no está
 * instalada o el link se abre en una computadora.
 */
const APP_LINK_TARGETS = {
  "billing/return": ROUTES.billingReturn,
  "confirm-email": ROUTES.confirmEmail,
} as const;

export type AppLinkPath = keyof typeof APP_LINK_TARGETS;

const APP_SCHEME = "discordia";
const ANDROID_PACKAGE = "com.g1discordia.appmobile";

export function isAppLinkPath(path: string): path is AppLinkPath {
  return Object.hasOwn(APP_LINK_TARGETS, path);
}

/**
 * Mercado Pago agrega sus parámetros con un segundo `?` aunque la URL ya tenga
 * query (`?kind=premium?preapproval_id=…`). Se pasan a `&` para que la app los
 * lea como parámetros comunes.
 */
export function normalizeQuery(rawQuery: string): string {
  const query = rawQuery.startsWith("?") ? rawQuery.slice(1) : rawQuery;
  return new URLSearchParams(query.replaceAll("?", "&")).toString();
}

export interface AppLinkTargets {
  /** `discordia://…`, para iOS y para el botón. */
  appUrl: string;
  /**
   * En Android, Chrome abre la app con un link `intent://` y, si no está
   * instalada, va solo a `browser_fallback_url`. Un salto directo a
   * `discordia://` sin toque del usuario a veces llega recortado o no pasa.
   */
  androidUrl: string;
  /** La misma pantalla en la web. */
  webUrl: string;
}

export function buildAppLinkTargets(
  path: AppLinkPath,
  rawQuery: string,
  origin: string,
): AppLinkTargets {
  const query = normalizeQuery(rawQuery);
  const suffix = query ? `?${query}` : "";
  const webUrl = `${origin}${APP_LINK_TARGETS[path]}${suffix}`;
  return {
    appUrl: `${APP_SCHEME}://${path}${suffix}`,
    androidUrl:
      `intent://${path}${suffix}#Intent;scheme=${APP_SCHEME};` +
      `package=${ANDROID_PACKAGE};` +
      `S.browser_fallback_url=${encodeURIComponent(webUrl)};end`,
    webUrl,
  };
}

export type AppLinkDevice = "android" | "ios" | "desktop";

export function deviceFromUserAgent(userAgent: string | null): AppLinkDevice {
  if (!userAgent) return "desktop";
  if (/Android/i.test(userAgent)) return "android";
  if (/iPhone|iPad|iPod/i.test(userAgent)) return "ios";
  return "desktop";
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

/** HTML mínimo y autónomo: intenta abrir la app y deja los dos botones a mano. */
export function renderAppLinkPage(
  targets: AppLinkTargets,
  device: Exclude<AppLinkDevice, "desktop">,
): string {
  const openUrl = device === "android" ? targets.androidUrl : targets.appUrl;
  // JSON.stringify no escapa `<`; sin esto un `</script>` en el query
  // cerraría el script.
  const openUrlJs = JSON.stringify(openUrl).replaceAll("<", "\\u003c");

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="referrer" content="no-referrer" />
    <title>Abriendo Discordia</title>
    <style>
      body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
        background: #1c293b; color: #f5f2eb; font-family: system-ui, sans-serif; text-align: center; }
      main { padding: 24px; max-width: 360px; }
      h1 { font-size: 20px; margin: 0 0 8px; }
      p { margin: 0 0 24px; color: #a8c6df; line-height: 1.4; }
      a { display: block; margin-top: 12px; padding: 14px; border-radius: 12px; font-weight: 700; text-decoration: none; }
      .app { background: #f0b232; color: #1c293b; }
      .web { border: 1px solid #6b95bd; color: #f5f2eb; }
    </style>
  </head>
  <body>
    <main>
      <h1>Abriendo Discordia…</h1>
      <p>Si la app no se abre sola, tocá el botón.</p>
      <a class="app" href="${escapeHtml(openUrl)}">Abrir la app</a>
      <a class="web" href="${escapeHtml(targets.webUrl)}">Seguir en la web</a>
    </main>
    <script>window.location.replace(${openUrlJs});</script>
  </body>
</html>`;
}
