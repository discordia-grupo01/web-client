import {
  PUSH_UNREGISTER_FAILED,
  type UnregisterPushDeviceResult,
} from "@discordia/client-shared";

import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { getValidSession } from "@/services/auth/session";
import { unregisterPushDevice } from "@/services/push/service";

type RouteContext = { params: { id: string } };

export async function DELETE(
  _request: Request,
  { params }: RouteContext,
): Promise<NextResponse<UnregisterPushDeviceResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const result = await unregisterPushDevice(session.token, params.id);
  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    return NextResponse.json(
      { ok: false, message: PUSH_UNREGISTER_FAILED },
      {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 502,
      },
    );
  }

  return NextResponse.json({ ok: true });
}
