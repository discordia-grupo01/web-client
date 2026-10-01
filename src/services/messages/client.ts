import { api } from "@/lib/browserApiClient";

/**
 * Llamadas del navegador hacia el BFF de mensajes (`/api/*`, mismo origen).
 */

export type SocketTokenResult =
  { ok: true; token: string } | { ok: false; sessionExpired: boolean };

/**
 * Pide el access token para abrir el WebSocket (ver
 * `app/api/realtime/token/route.ts`). `sessionExpired` distingue una sesion
 * muerta (hay que cerrar el socket y dejar actuar el flujo de sesion
 * expirada) de un fallo transitorio de red (se puede reintentar).
 */
export async function fetchSocketTokenRequest(): Promise<SocketTokenResult> {
  try {
    const { data, status } = await api.get<{ token?: string }>(
      "/realtime/token",
    );
    if (status === 200 && typeof data?.token === "string") {
      return { ok: true, token: data.token };
    }
    return { ok: false, sessionExpired: status === 401 };
  } catch {
    return { ok: false, sessionExpired: false };
  }
}
