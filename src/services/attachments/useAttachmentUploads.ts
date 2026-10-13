"use client";

import type {
  AttachmentTarget,
  MessageAttachment,
} from "@discordia/client-shared";
import { useCallback, useRef } from "react";

import { uploadAttachmentRequest } from "./client";

export type UploadAllResult =
  { ok: true; ids: string[] } | { ok: false; message: string };

/**
 * Sube los archivos pendientes de un mensaje, de a uno. Recuerda los que ya
 * subio: si el envio falla despues de subir, el reintento reusa esos ids en
 * vez de subirlos otra vez (cada subida cuenta contra el tope de pendientes
 * del back).
 */
export function useAttachmentUploads() {
  const uploaded = useRef(new Map<string, MessageAttachment>());

  const uploadAll = useCallback(
    async (
      items: readonly { id: string; file: File }[],
      target: AttachmentTarget,
    ): Promise<UploadAllResult> => {
      const ids: string[] = [];
      for (const { id, file } of items) {
        let attachment = uploaded.current.get(id);
        if (!attachment) {
          const result = await uploadAttachmentRequest(file, target);
          if (!result.ok) return result;
          attachment = result.attachment;
          uploaded.current.set(id, attachment);
        }
        ids.push(attachment.id);
      }
      return { ok: true, ids };
    },
    [],
  );

  const forget = useCallback(() => uploaded.current.clear(), []);

  return { uploadAll, forget };
}
