import {
  CHANNEL_DELETE_FAILED,
  CHANNEL_REASONS,
  CHANNEL_UPDATE_FAILED,
  fieldOf,
  messageFor,
  reasonOf,
} from "@discordia/client-shared";
import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/api-route";
import { getValidSession } from "@/services/auth/session";
import { deleteChannel, updateChannel } from "@/services/channels/service";
import type {
  DeleteChannelActionResult,
  UpdateChannelActionResult,
} from "@/types/channel.types";

/**
 * BFF de `PATCH /v1/channels/:id`. Body JSON: `{ name }`.
 */
export async function PATCH(
  request: Request,
  { params }: { params: { channelId: string } },
): Promise<NextResponse<UpdateChannelActionResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name : "";

  const result = await updateChannel(session.token, params.channelId, {
    name,
  });

  if (!result.ok) {
    const field = fieldOf(result.details);
    const reason = reasonOf(result.details);
    const friendly = reason ? CHANNEL_REASONS[reason] : undefined;

    if (field === "name" && friendly) {
      return NextResponse.json(
        { ok: false, message: friendly, fieldErrors: { name: friendly } },
        { status: result.status || 400 },
      );
    }
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    return NextResponse.json(
      {
        ok: false,
        message: messageFor(result, CHANNEL_REASONS, CHANNEL_UPDATE_FAILED),
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
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const result = await deleteChannel(session.token, params.channelId);

  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    return NextResponse.json(
      { ok: false, message: CHANNEL_DELETE_FAILED },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
