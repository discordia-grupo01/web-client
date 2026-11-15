import {
  INVALID_DATA_MESSAGE,
  saveVanityFailureMessage,
} from "@discordia/client-shared";
import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { getValidSession } from "@/services/auth/session";
import type { SetVanityResult } from "@/services/servers/client";
import { setVanityCode } from "@/services/servers/service";

function failureStatus(status: number): number {
  return status >= 400 && status < 500 ? status : 502;
}

/** BFF de `PATCH /v1/servers/:id/vanity`. Body JSON: `{ code: string | null }`. */
export async function PATCH(
  request: Request,
  { params }: { params: { serverId: string } },
): Promise<NextResponse<SetVanityResult>> {
  const session = await getValidSession();
  if (!session) return unauthorizedResponse();

  let code: string | null | undefined;
  try {
    const body: unknown = await request.json();
    const raw = (body as { code?: unknown } | null)?.code;
    if (raw === null || typeof raw === "string") code = raw;
  } catch {
    // Body inválido: se responde abajo.
  }
  if (code === undefined) {
    return NextResponse.json(
      { ok: false, message: INVALID_DATA_MESSAGE },
      { status: 400 },
    );
  }

  const result = await setVanityCode(session.token, params.serverId, code);
  if (!result.ok) {
    if (result.status === 401) return unauthorizedResponse();
    return NextResponse.json(
      { ok: false, message: saveVanityFailureMessage(result) },
      { status: failureStatus(result.status) },
    );
  }
  return NextResponse.json({ ok: true, vanity_code: result.data.vanity_code });
}
