import "server-only";

import { apiRequest, type ApiResult } from "@/lib/apiClient";

export interface AttachmentTicket {
  ticket: string;
  expires_in: number;
}

/** `POST /v1/attachment-tickets`: ticket de un solo uso para subir un adjunto. */
export function createAttachmentTicket(
  token: string,
): Promise<ApiResult<AttachmentTicket>> {
  return apiRequest<AttachmentTicket>("/v1/attachment-tickets", {
    method: "POST",
    token,
  });
}
