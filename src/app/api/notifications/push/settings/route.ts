import {
  type LoadPushSettingsResult,
  parsePushSettings,
  PUSH_SETTINGS_LOAD_FAILED,
  PUSH_SETTINGS_SAVE_FAILED,
  type SavePushSettingsResult,
} from "@discordia/client-shared";

import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { getValidSession } from "@/services/auth/session";
import { getPushSettings, updatePushSettings } from "@/services/push/service";

const clientStatus = (status: number) =>
  status >= 400 && status < 500 ? status : 502;

export async function GET(): Promise<NextResponse<LoadPushSettingsResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const result = await getPushSettings(session.token);
  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    return NextResponse.json(
      { ok: false, message: PUSH_SETTINGS_LOAD_FAILED },
      { status: clientStatus(result.status) },
    );
  }

  return NextResponse.json({ ok: true, enabled: result.data.enabled });
}

export async function PUT(
  request: Request,
): Promise<NextResponse<SavePushSettingsResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const settings = parsePushSettings(await request.json().catch(() => null));
  if (!settings) {
    return NextResponse.json(
      { ok: false, message: PUSH_SETTINGS_SAVE_FAILED },
      { status: 400 },
    );
  }

  const result = await updatePushSettings(session.token, settings);
  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    return NextResponse.json(
      { ok: false, message: PUSH_SETTINGS_SAVE_FAILED },
      { status: clientStatus(result.status) },
    );
  }

  return NextResponse.json({ ok: true, enabled: result.data.enabled });
}
