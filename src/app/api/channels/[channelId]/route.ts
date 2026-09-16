import { NextResponse } from "next/server";

import { getSession } from "@/services/auth/session";
import { deleteChannel, updateChannel } from "@/services/channels/service";
import type {
  DeleteChannelActionResult,
  UpdateChannelActionResult,
} from "@/services/channels/types";

const SESSION_EXPIRED = "Tu sesión expiró. Volvé a iniciar sesión.";

const REASON_MESSAGES: Record<string, string> = {
  name_required: "Ingresá un nombre para el canal.",
  name_too_long: "El nombre es demasiado largo.",
  name_invalid_chars: "El nombre tiene caracteres invalidos.",
  name_taken: "Ya existe un canal con ese nombre en esa categoria.",
};

/**
 * BFF de `PATCH /v1/channels/:id`. Body JSON: `{ name }`.
 */
export async function PATCH(
  request: Request,
  { params }: { params: { channelId: string } },
): Promise<NextResponse<UpdateChannelActionResult>> {
  const session = getSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, message: SESSION_EXPIRED },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name : "";

  const result = await updateChannel(session.token, params.channelId, {
    name,
  });

  if (!result.ok) {
    const field =
      typeof result.details?.field === "string"
        ? result.details.field
        : undefined;
    const reason =
      typeof result.details?.reason === "string"
        ? result.details.reason
        : undefined;
    const friendly = reason ? REASON_MESSAGES[reason] : undefined;

    if (field === "name" && friendly) {
      return NextResponse.json(
        { ok: false, message: friendly, fieldErrors: { name: friendly } },
        { status: result.status || 400 },
      );
    }
    if (result.status === 401) {
      return NextResponse.json(
        { ok: false, message: SESSION_EXPIRED },
        { status: 401 },
      );
    }
    return NextResponse.json(
      {
        ok: false,
        message: friendly ?? "No pudimos editar el canal. Intenta de nuevo.",
      },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  return NextResponse.json({ ok: true, channel: result.data }, { status: 200 });
}

/**
 * BFF de `DELETE /v1/channels/:id`. Sin body.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: { channelId: string } },
): Promise<NextResponse<DeleteChannelActionResult>> {
  const session = getSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, message: SESSION_EXPIRED },
      { status: 401 },
    );
  }

  const result = await deleteChannel(session.token, params.channelId);

  if (!result.ok) {
    if (result.status === 401) {
      return NextResponse.json(
        { ok: false, message: SESSION_EXPIRED },
        { status: 401 },
      );
    }
    return NextResponse.json(
      { ok: false, message: "No pudimos eliminar el canal. Intenta de nuevo." },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
