import {
  type LoadVapidKeyResult,
  PUSH_NOT_AVAILABLE,
  PUSH_REGISTER_FAILED,
} from "@discordia/client-shared";

import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { getValidSession } from "@/services/auth/session";
import { getVapidPublicKey } from "@/services/push/service";

export async function GET(): Promise<NextResponse<LoadVapidKeyResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const result = await getVapidPublicKey(session.token);
  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    if (result.status === 404) {
      return NextResponse.json(
        { ok: false, message: PUSH_NOT_AVAILABLE },
        { status: 404 },
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

  return NextResponse.json({ ok: true, publicKey: result.data.public_key });
}
