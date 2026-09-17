import { NextResponse } from "next/server";

import { getValidSession } from "@/services/auth/session";
import { getServerIcon } from "@/services/servers/service";

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
  const session = await getValidSession();
  if (!session) {
    return new NextResponse(null, { status: 401 });
  }

  const result = await getServerIcon(session.token, params.serverId);

  if (!result.ok) {
    return new NextResponse(null, { status: result.status });
  }

  return new NextResponse(result.body, {
    status: 200,
    headers: {
      "Content-Type": result.contentType,
      "Cache-Control": "private, max-age=300",
    },
  });
}
