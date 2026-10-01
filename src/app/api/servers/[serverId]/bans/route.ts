import {
  BAN_REASONS,
  BANS_LOAD_FAILED,
  type BanMemberResult,
  type ListBansResult,
  messageFor,
  OWNER_ONLY_BAN,
  fieldOf,
  UNEXPECTED_ERROR_MESSAGE,
  validateBanReason,
} from "@discordia/client-shared";
import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/api-route";
import { getValidSession } from "@/services/auth/session";
import { banMember, listBans } from "@/services/bans/service";

/**
 * BFF de `GET /v1/servers/:id/bans`. Devuelve la lista completa (el service
 * recorre las paginas del back): la busqueda por nombre y la paginacion en
 * pantalla las hace el front.
 */
export async function GET(
  _request: Request,
  { params }: { params: { serverId: string } },
): Promise<NextResponse<ListBansResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const result = await listBans(session.token, params.serverId);
  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    return NextResponse.json(
      {
        ok: false,
        message: result.status === 403 ? OWNER_ONLY_BAN : BANS_LOAD_FAILED,
      },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  return NextResponse.json(
    { ok: true, bans: result.data.bans, total: result.data.total },
    { status: 200 },
  );
}

/**
 * BFF de `POST /v1/servers/:id/bans`. Body JSON: `{ user_id, reason? }`. El
 * back valida permiso, jerarquia de roles y que el objetivo sea miembro.
 */
export async function POST(
  request: Request,
  { params }: { params: { serverId: string } },
): Promise<NextResponse<BanMemberResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  let userId = "";
  let reason = "";
  try {
    const body = await request.json();
    if (typeof body?.user_id === "string") userId = body.user_id.trim();
    if (typeof body?.reason === "string") reason = body.reason.trim();
  } catch {
    // Sin body: el back lo va a rechazar como "required".
  }

  const reasonError = validateBanReason(reason);
  if (reasonError) {
    return NextResponse.json(
      { ok: false, message: reasonError, fieldErrors: { reason: reasonError } },
      { status: 400 },
    );
  }

  const result = await banMember(
    session.token,
    params.serverId,
    userId,
    reason || null,
  );

  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }

    const message = messageFor(
      result,
      BAN_REASONS,
      result.status === 403 ? OWNER_ONLY_BAN : UNEXPECTED_ERROR_MESSAGE,
    );
    const field = fieldOf(result.details);
    return NextResponse.json(
      {
        ok: false,
        message,
        ...(field === "reason" ? { fieldErrors: { reason: message } } : {}),
      },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  return NextResponse.json({ ok: true, ban: result.data }, { status: 201 });
}
