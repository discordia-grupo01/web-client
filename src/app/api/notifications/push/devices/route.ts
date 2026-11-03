import {
  parsePushDeviceRequest,
  PUSH_DEVICE_LIMIT_REACHED,
  PUSH_REGISTER_FAILED,
  type RegisterPushDeviceResult,
} from "@discordia/client-shared";

import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { getValidSession } from "@/services/auth/session";
import { registerPushDevice } from "@/services/push/service";

export async function POST(
  request: Request,
): Promise<NextResponse<RegisterPushDeviceResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const device = parsePushDeviceRequest(await request.json().catch(() => null));
  if (!device) {
    return NextResponse.json(
      { ok: false, message: PUSH_REGISTER_FAILED },
      { status: 400 },
    );
  }

  const result = await registerPushDevice(session.token, device);
  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    if (result.status === 409) {
      return NextResponse.json(
        { ok: false, message: PUSH_DEVICE_LIMIT_REACHED, limitReached: true },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { ok: false, message: PUSH_REGISTER_FAILED },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  return NextResponse.json({ ok: true, id: result.data.id });
}
