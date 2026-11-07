import {
  ATTACHMENT_UPLOAD_FAILED,
  attachmentUploadQuery,
  toApiResult,
  toUploadAttachmentResult,
  type AttachmentTarget,
  type MessageAttachment,
  type UploadAttachmentResult,
} from "@discordia/client-shared";
import axios from "axios";

import { api } from "@/lib/browserApiClient";
import { env } from "@/lib/env";

/**
 * Margen para un archivo de 50 MB en una conexion lenta. El ticket vence antes,
 * pero `messaging` lo canjea al recibir el pedido, no al terminar de leerlo.
 */
const UPLOAD_TIMEOUT_MS = 5 * 60_000;

/**
 * Sube un archivo directo al gateway. No pasa por el BFF porque Vercel corta
 * sus pedidos en 4,5 MB. El ticket se pide justo antes de cada archivo: es de
 * un solo uso y dura 60 s.
 */
export async function uploadAttachmentRequest(
  file: File,
  target: AttachmentTarget,
): Promise<UploadAttachmentResult> {
  try {
    const { data } = await api.post<{ ticket?: string; message?: string }>(
      "/attachments/ticket",
    );
    if (!data?.ticket) {
      return {
        ok: false,
        message: data?.message ?? ATTACHMENT_UPLOAD_FAILED,
      };
    }

    const response = await axios.post<unknown>(
      `${env.uploadUrl}/v1/attachments/direct?${attachmentUploadQuery(target, file.name)}`,
      file,
      {
        headers: {
          "Content-Type": "application/octet-stream",
          "X-Upload-Ticket": data.ticket,
        },
        timeout: UPLOAD_TIMEOUT_MS,
        validateStatus: () => true,
      },
    );
    return toUploadAttachmentResult(
      toApiResult<MessageAttachment>(response.status, response.data),
    );
  } catch {
    return { ok: false, message: ATTACHMENT_UPLOAD_FAILED };
  }
}
