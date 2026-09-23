import { NextResponse } from "next/server";

import { getValidSession } from "@/services/auth/session";
import { getServerBanner } from "@/services/servers/service";

/**
 * BFF de `GET /v1/servers/:serverId/banner`, gemelo del de `/icon`: ese
 * endpoint exige JWT (via el plugin jwt de Kong) y un <img src="..."> del
 * navegador no puede mandar el header Authorization.
 *
 * El 404 ("este servidor no tiene banner") se reenvia tal cual: quien lo pide
 * ya sabe por `banner_url` si hay banner, asi que es un caso esperado y no un
 * error que haya que mostrarle a nadie.
 */
export async function GET(
  _request: Request,
  { params }: { params: { serverId: string } },
): Promise<NextResponse> {
  const session = await getValidSession();
  if (!session) {
    return new NextResponse(null, { status: 401 });
  }

  const result = await getServerBanner(session.token, params.serverId);

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
