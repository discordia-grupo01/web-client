import {
  NOTIFICATION_SETTINGS_SAVE_FAILED,
  parseNotificationSettingsPatch,
  type UpdateNotificationSettingsResult,
} from "@discordia/client-shared";

import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { getValidSession } from "@/services/auth/session";
import { updateChannelNotificationSettings } from "@/services/notifications/service";

type RouteContext = { params: { channelId: string } };

export async function PUT(
  request: Request,
  { params }: RouteContext,
): Promise<NextResponse<UpdateNotificationSettingsResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const patch = parseNotificationSettingsPatch(
    await request.json().catch(() => null),
  );
  if (!patch) {
    return NextResponse.json(
      { ok: false, message: NOTIFICATION_SETTINGS_SAVE_FAILED },
      { status: 400 },
    );
  }

  const result = await updateChannelNotificationSettings(
    session.token,
    params.channelId,
    patch,
  );
  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    return NextResponse.json(
      { ok: false, message: NOTIFICATION_SETTINGS_SAVE_FAILED },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  return NextResponse.json({
    ok: true,
    muted: result.data.muted,
    level: result.data.level,
  });
}
