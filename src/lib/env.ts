const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/** `http(s)://host` -> `ws(s)://host`. */
function toWebSocketUrl(httpUrl: string): string {
  return httpUrl.replace(/^http/, "ws");
}

export const env = {
  apiUrl,
  /**
   * Base del socket de Phoenix (el cliente le agrega `/websocket`).
   *
   * Junto con `uploadUrl`, es de los pocos accesos al gateway que hace el
   * NAVEGADOR (casi todo pasa por el BFF, que habla desde el servidor). Por eso
   * puede necesitar otra
   * direccion que `apiUrl`: en el compose local `NEXT_PUBLIC_API_URL` es
   * `http://gateway:8000`, un nombre que solo existe dentro de Docker. Ahi hay
   * que definir `NEXT_PUBLIC_WS_URL=ws://localhost:8000/socket`.
   */
  /**
   * Base del gateway para subir adjuntos desde el navegador. Como con `wsUrl`,
   * en el compose local hay que definir
   * `NEXT_PUBLIC_UPLOAD_URL=http://localhost:8000`.
   */
  uploadUrl: process.env.NEXT_PUBLIC_UPLOAD_URL ?? apiUrl,
  wsUrl: process.env.NEXT_PUBLIC_WS_URL ?? `${toWebSocketUrl(apiUrl)}/socket`,
  voiceWsUrl:
    process.env.NEXT_PUBLIC_VOICE_WS_URL ??
    `${toWebSocketUrl(apiUrl)}/voice/socket`,
  notificationsWsUrl:
    process.env.NEXT_PUBLIC_NOTIFICATIONS_WS_URL ??
    `${toWebSocketUrl(apiUrl)}/notifications/socket`,
};

export const isProduction = process.env.NODE_ENV === "production";
