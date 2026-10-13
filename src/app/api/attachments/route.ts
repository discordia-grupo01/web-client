import {
  ATTACHMENT_UPLOAD_FAILED,
  toUploadAttachmentResult,
  type UploadAttachmentResult,
} from "@discordia/client-shared";
import { NextResponse, type NextRequest } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { getValidSession } from "@/services/auth/session";
import { uploadAttachment } from "@/services/attachments/service";

/**
 * BFF de `POST /v1/attachments`. Query: `channel_id` o `to`, y `filename`
 * opcional. El cuerpo son los bytes del archivo, tal cual los espera el back.
 */
export async function POST(
  request: NextRequest,
): Promise<NextResponse<UploadAttachmentResult>> {
  const session = await getValidSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const { searchParams } = request.nextUrl;
  const channelId = searchParams.get("channel_id");
  const to = searchParams.get("to");
  const target = channelId ? { channelId } : to ? { to } : null;
  if (!target) {
    return NextResponse.json(
      { ok: false, message: ATTACHMENT_UPLOAD_FAILED },
      { status: 400 },
    );
  }

  const body = Buffer.from(await request.arrayBuffer());
  const result = await uploadAttachment(
    session.token,
    target,
    body,
    searchParams.get("filename") ?? undefined,
  );

  if (!result.ok && result.status === 401) {
    return unauthorizedResponse();
  }

  const mapped = toUploadAttachmentResult(result);
  return NextResponse.json(mapped, {
    status: mapped.ok
      ? 201
      : result.ok
        ? 502
        : result.status >= 400 && result.status < 500
          ? result.status
          : 502,
  });
}
