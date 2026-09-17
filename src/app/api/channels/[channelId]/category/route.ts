import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/api-route";
import { getValidSession } from "@/services/auth/session";
import { moveChannelToCategory } from "@/services/channels/service";
import type { MoveChannelActionResult } from "@/types/channel.types";

const REASON_MESSAGES: Record<string, string> = {
  name_taken: "Ya existe un canal con ese nombre en esa categoría.",
};

/**
 * BFF de `PATCH /v1/channels/:id/category`. Body JSON: `{ categoryId: string | null }`.
 * `categoryId: null` mueve el canal a "sin categoria".
 */
export async function PATCH(
  request: Request,
  { params }: { params: { channelId: string } },
): Promise<NextResponse<MoveChannelActionResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const body = await request.json().catch(() => null);
  const categoryId =
    typeof body?.categoryId === "string" ? body.categoryId : null;

  const result = await moveChannelToCategory(
    session.token,
    params.channelId,
    categoryId,
  );

  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    const reason =
      typeof result.details?.reason === "string"
        ? result.details.reason
        : undefined;
    const friendly = reason ? REASON_MESSAGES[reason] : undefined;
    return NextResponse.json(
      {
        ok: false,
        message: friendly ?? "No pudimos mover el canal. Intenta de nuevo.",
      },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  return NextResponse.json({ ok: true, channel: result.data }, { status: 200 });
}
