import { CHANNEL_REORDER_FAILED } from "@discordia/client-shared";

import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/api-route";
import { getValidSession } from "@/services/auth/session";
import { reorderChannels } from "@/services/channels/service";
import type { ReorderChannelsActionResult } from "@/types/channel.types";

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
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
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
      return unauthorizedResponse();
    }
    return NextResponse.json(
      {
        ok: false,
        message: CHANNEL_REORDER_FAILED,
      },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
