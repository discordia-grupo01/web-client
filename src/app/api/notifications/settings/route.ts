import {
  type ListNotificationSettingsResult,
  NOTIFICATION_SETTINGS_LOAD_FAILED,
} from "@discordia/client-shared";

import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { getValidSession } from "@/services/auth/session";
import { getNotificationSettings } from "@/services/notifications/service";

export async function GET(): Promise<
  NextResponse<ListNotificationSettingsResult>
> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const result = await getNotificationSettings(session.token);
  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    return NextResponse.json(
      { ok: false, message: NOTIFICATION_SETTINGS_LOAD_FAILED },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  return NextResponse.json({
    ok: true,
    servers: result.data.servers,
    channels: result.data.channels,
    preferences: result.data.preferences,
  });
}
