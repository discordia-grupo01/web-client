import {
  type CreateServerResult,
  SERVERS_LOAD_FAILED,
  UNEXPECTED_ERROR_MESSAGE,
} from "@discordia/client-shared";
import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/api-route";
import { getValidSession } from "@/services/auth/session";
import { serverErrorResponse } from "@/services/servers/error-payload";
import { createServer, listMyServers } from "@/services/servers/service";

/**
 * BFF de `GET /v1/servers`. El navegador pega aca (mismo origen); reenvia el
 * JWT de la cookie httpOnly, nunca lo expone.
 */
export async function GET(): Promise<NextResponse> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const result = await listMyServers(session.token);
  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: SERVERS_LOAD_FAILED,
      },
      { status: result.status || 502 },
    );
  }

  return NextResponse.json({ ok: true, servers: result.data }, { status: 200 });
}

/**
 * BFF de `POST /v1/servers`. Recibe el FormData tal cual llega del navegador
 * (multipart/form-data: name + icon opcional) y lo reenvia al servicio.
 */
export async function POST(
  request: Request,
): Promise<NextResponse<CreateServerResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { ok: false, message: UNEXPECTED_ERROR_MESSAGE },
      { status: 400 },
    );
  }

  const result = await createServer(session.token, formData);

  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }

    const { payload, status } = serverErrorResponse(
      result,
      UNEXPECTED_ERROR_MESSAGE,
    );
    return NextResponse.json(payload, { status });
  }

  return NextResponse.json({ ok: true, server: result.data }, { status: 201 });
}
