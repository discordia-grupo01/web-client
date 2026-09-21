import {
  CHANNEL_MOVE_FAILED,
  CHANNEL_REASONS,
  messageFor,
  type MoveChannelResult,
  reasonOf,
} from "@discordia/client-shared";
import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/api-route";
import { getValidSession } from "@/services/auth/session";
import { moveChannelToCategory } from "@/services/channels/service";

/**
 * BFF de `PATCH /v1/channels/:id/category`. Body JSON: `{ categoryId: string | null }`.
 * `categoryId: null` mueve el canal a "sin categoria".
 */
export async function PATCH(
  request: Request,
  { params }: { params: { channelId: string } },
): Promise<NextResponse<MoveChannelResult>> {
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
    const reason = reasonOf(result.details);
    const friendly = reason ? CHANNEL_REASONS[reason] : undefined;
    return NextResponse.json(
      {
        ok: false,
        message: messageFor(result, CHANNEL_REASONS, CHANNEL_MOVE_FAILED),
      },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  return NextResponse.json({ ok: true, channel: result.data }, { status: 200 });
}
