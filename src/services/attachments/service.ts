import {
  attachmentUploadQuery,
  type AttachmentTarget,
  type MessageAttachment,
} from "@discordia/client-shared";

import "server-only";

import { apiRequest, type ApiResult } from "@/lib/apiClient";

/**
 * Subida de adjuntos contra `messaging` (via el gateway Kong).
 *
 *   POST /v1/attachments?channel_id=|to=&filename=   (cuerpo = bytes del archivo)
 *     -> 201 { id, url, name, content_type, size }
 *      | 400 EMPTY_FILE / INVALID_PAYLOAD | 401 | 403 FORBIDDEN / MEMBER_MUTED / USER_BLOCKED
 *      | 404 | 413 FILE_TOO_LARGE | 415 UNSUPPORTED_FILE_TYPE
 *      | 429 TOO_MANY_PENDING_ATTACHMENTS | 503 STORAGE_UNAVAILABLE
 */
const UPLOAD_TIMEOUT_MS = 60_000;

export function uploadAttachment(
  token: string,
  target: AttachmentTarget,
  body: Buffer,
  filename?: string,
): Promise<ApiResult<MessageAttachment>> {
  return apiRequest<MessageAttachment>(
    `/v1/attachments?${attachmentUploadQuery(target, filename)}`,
    {
      method: "POST",
      token,
      data: body,
      headers: { "Content-Type": "application/octet-stream" },
      timeout: UPLOAD_TIMEOUT_MS,
      maxBodyLength: Infinity,
    },
  );
}
