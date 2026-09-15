import { NextResponse } from "next/server";

import { getSession } from "@/features/auth/session";
import { reorderChannels } from "@/features/servers/service";
import type { ReorderChannelsActionResult } from "@/features/servers/types";

const SESSION_EXPIRED = "Tu sesion expiro. Volve a iniciar sesion.";

/**
 * BFF de `PATCH /v1/servers/:id/channels/reorder`. Body JSON:
 * `{ categoryId: string | null, channelIds: string[] }`. `channelIds` tiene
 * que ser exactamente el set de canales que ya está en esa categoría (o en
 * "sin categoría" si `categoryId` es `null`).
 */
export async function PATCH(
  request: Request,
  { params }: { params: { serverId: string } },
): Promise<NextResponse<ReorderChannelsActionResult>> {
  const session = getSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, message: SESSION_EXPIRED },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null);
  const categoryId =
    typeof body?.categoryId === "string" ? body.categoryId : null;
  const channelIds = Array.isArray(body?.channelIds)
    ? body.channelIds.filter(
        (id: unknown): id is string => typeof id === "string",
      )
    : [];

  const result = await reorderChannels(
    session.token,
    params.serverId,
    categoryId,
    channelIds,
  );

  if (!result.ok) {
    if (result.status === 401) {
      return NextResponse.json(
        { ok: false, message: SESSION_EXPIRED },
        { status: 401 },
      );
    }
    return NextResponse.json(
      {
        ok: false,
        message: "No pudimos reordenar los canales. Intenta de nuevo.",
      },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
