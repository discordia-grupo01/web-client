const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/** `http(s)://host` -> `ws(s)://host`: el WebSocket de mensajes sale por el mismo gateway. */
function toWebSocketUrl(httpUrl: string): string {
  return httpUrl.replace(/^http/, "ws");
}

export const env = {
  apiUrl,
  /**
   * Base del socket de Phoenix (el cliente le agrega `/websocket`).
   *
   * Es el unico acceso al gateway que hace el NAVEGADOR (todo lo demas pasa por
   * el BFF, que habla desde el servidor). Por eso puede necesitar otra
   * direccion que `apiUrl`: en el compose local `NEXT_PUBLIC_API_URL` es
   * `http://gateway:8000`, un nombre que solo existe dentro de Docker. Ahi hay
   * que definir `NEXT_PUBLIC_WS_URL=ws://localhost:8000/socket`.
   */
  wsUrl: process.env.NEXT_PUBLIC_WS_URL ?? `${toWebSocketUrl(apiUrl)}/socket`,
};

export const isProduction = process.env.NODE_ENV === "production";
