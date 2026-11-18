import {
  type MarkTransfersReadResult,
  NOTIFICATIONS_MARK_ALL_READ_FAILED,
} from "@discordia/client-shared";

import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { getValidSession } from "@/services/auth/session";
import { markTransfersRead } from "@/services/notifications/service";

const failure = (status: number) =>
  NextResponse.json<MarkTransfersReadResult>(
    { ok: false, message: NOTIFICATIONS_MARK_ALL_READ_FAILED },
    { status },
  );

function parseTransferIds(body: unknown): string[] | null {
  if (typeof body !== "object" || body === null) return null;
  const ids = (body as { transfer_ids?: unknown }).transfer_ids;
  if (!Array.isArray(ids) || ids.length === 0) return null;
  return ids.every((id) => typeof id === "string") ? (ids as string[]) : null;
}

export async function POST(
  request: Request,
): Promise<NextResponse<MarkTransfersReadResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const transferIds = parseTransferIds(await request.json().catch(() => null));
  if (!transferIds) {
    return failure(400);
  }

  const result = await markTransfersRead(session.token, transferIds);
  if (!result.ok) {
    if (result.status === 401) {
      return unauthorizedResponse();
    }
    return failure(
      result.status >= 400 && result.status < 500 ? result.status : 502,
    );
  }

  return NextResponse.json({ ok: true });
}
