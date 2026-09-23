import {
  SERVER_UPDATE_FAILED,
  SERVER_UPDATE_FORBIDDEN,
  type UpdateServerResult,
} from "@discordia/client-shared";
import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/api-route";
import { getValidSession } from "@/services/auth/session";
import { serverErrorResponse } from "@/services/servers/error-payload";
import { updateServer } from "@/services/servers/service";

/**
 * BFF de `PATCH /v1/servers/:serverId`. Recibe el FormData tal cual llega del
 * navegador (multipart/form-data: name, icon, banner y `remove_banner`, todos
 * opcionales) y lo reenvia con el JWT de la cookie httpOnly.
 *
 * El 403 se traduce aparte: hoy el backend solo deja editar al owner, asi que
 * es el unico caso donde "no podes" no viene con un `details.reason`.
 */
export async function PATCH(
  request: Request,
  { params }: { params: { serverId: string } },
): Promise<NextResponse<UpdateServerResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { ok: false, message: SERVER_UPDATE_FAILED },
      { status: 400 },
    );
  }

  const result = await updateServer(session.token, params.serverId, formData);

  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    if (result.status === 403) {
      return NextResponse.json(
        { ok: false, message: SERVER_UPDATE_FORBIDDEN },
        { status: 403 },
      );
    }

    const { payload, status } = serverErrorResponse(
      result,
      SERVER_UPDATE_FAILED,
    );
    return NextResponse.json(payload, { status });
  }

  return NextResponse.json({ ok: true, server: result.data }, { status: 200 });
}
