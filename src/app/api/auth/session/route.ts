import { NextResponse } from "next/server";

import { getValidSession } from "@/services/auth/session";

/**
 * BFF-only: no devuelve datos de la sesion, solo la deja vigente -- refresca
 * el access token (y rota el refresh token) si hacia falta.
 *
 * El navegador la llama ANTES de disparar el resto de los requests
 * autenticados de una pantalla (ver el interceptor de
 * `@/lib/browserApiClient`). Al ser una unica invocacion esperada por todos
 * esos requests desde la misma pestaña, el refresh ocurre como mucho una vez
 * por ciclo de inactividad, en lugar de una vez por cada ruta BFF que la
 * pantalla dispare en paralelo (que en Vercel pueden caer en funciones
 * serverless distintas y pisarse la rotacion del refresh token entre si).
 */
export async function GET(): Promise<NextResponse<{ ok: boolean }>> {
  const session = await getValidSession();
  return NextResponse.json({ ok: session !== null }, { status: 200 });
}
