import {
  ATTACHMENT_UPLOAD_FAILED,
  attachmentUploadQuery,
  type AttachmentTarget,
  type UploadAttachmentResult,
} from "@discordia/client-shared";

import { api } from "@/lib/browserApiClient";

/** Sube un archivo al BFF (`/api/attachments`, mismo origen); el BFF lo manda al back. */
export async function uploadAttachmentRequest(
  file: File,
  target: AttachmentTarget,
): Promise<UploadAttachmentResult> {
  try {
    const { data } = await api.post<UploadAttachmentResult>(
      `/attachments?${attachmentUploadQuery(target, file.name)}`,
      file,
      { headers: { "Content-Type": "application/octet-stream" } },
    );
    if (typeof data?.ok !== "boolean") {
      return { ok: false, message: ATTACHMENT_UPLOAD_FAILED };
    }
    return data;
  } catch {
    return { ok: false, message: ATTACHMENT_UPLOAD_FAILED };
  }
}
