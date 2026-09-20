import { reasonOf } from "@discordia/client-shared";
import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/api-route";
import { getValidSession } from "@/services/auth/session";
import { createChannel } from "@/services/channels/service";
import type { CreateChannelActionResult } from "@/types/channel.types";

const REASON_MESSAGES: Record<string, string> = {
  name_required: "Ingresá un nombre para el canal.",
  name_too_long: "El nombre es demasiado largo.",
  name_invalid_chars: "El nombre tiene caracteres invalidos.",
  name_taken: "Ya existe un canal con ese nombre en esa categoria.",
  kind_invalid: "El tipo de canal debe ser texto o voz.",
  category_server_mismatch: "Esa categoria no pertenece a este servidor.",
};

/**
 * BFF de `POST /v1/servers/:id/channels`. Body JSON: `{ name, kind, categoryId? }`.
 * Solo el owner del server puede crear canales (403 del back si no).
 */
export async function POST(
  request: Request,
  { params }: { params: { serverId: string } },
): Promise<NextResponse<CreateChannelActionResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name : "";
  const kind = body?.kind === "voice" ? "voice" : "text";
  const categoryId =
    typeof body?.categoryId === "string" ? body.categoryId : undefined;

  const result = await createChannel(session.token, params.serverId, {
    name,
    kind,
    categoryId,
  });

  if (!result.ok) {
    const field =
      typeof result.details?.field === "string"
        ? result.details.field
        : undefined;
    const reason = reasonOf(result.details);
    const friendly = reason ? REASON_MESSAGES[reason] : undefined;

    if (field && friendly && (field === "name" || field === "kind")) {
      return NextResponse.json(
        { ok: false, message: friendly, fieldErrors: { [field]: friendly } },
        { status: result.status || 400 },
      );
    }
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    return NextResponse.json(
      {
        ok: false,
        message: friendly ?? "No pudimos crear el canal. Intenta de nuevo.",
      },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  return NextResponse.json({ ok: true, channel: result.data }, { status: 201 });
}
