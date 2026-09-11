import { NextResponse } from "next/server";

import { getSession } from "@/features/auth/session";
import { env } from "@/lib/env";

/**
 * BFF de `GET /v1/servers/:serverId/icon`. Ese endpoint exige JWT (via el
 * plugin jwt de Kong), y un <img src="..."> del navegador no puede mandar el
 * header Authorization -- por eso este proxy lee la cookie httpOnly, reenvia
 * el token, y devuelve el binario tal cual.
 */
export async function GET(
  _request: Request,
  { params }: { params: { serverId: string } },
): Promise<NextResponse> {
  const session = getSession();
  if (!session) {
    return new NextResponse(null, { status: 401 });
  }

  const response = await fetch(
    `${env.apiUrl}/v1/servers/${params.serverId}/icon`,
    { headers: { Authorization: `Bearer ${session.token}` } },
  );

  if (!response.ok || !response.body) {
    return new NextResponse(null, { status: response.status || 502 });
  }

  return new NextResponse(response.body, {
    status: 200,
    headers: {
      "Content-Type": response.headers.get("content-type") ?? "image/png",
      "Cache-Control": "private, max-age=300",
    },
  });
}
