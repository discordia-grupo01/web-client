import {
  formatFileSize,
  isImageAttachment,
  type MessageAttachment,
} from "@discordia/client-shared";

import { File as FileIcon } from "lucide-react";

interface MessageAttachmentsProps {
  attachments: MessageAttachment[];
}

/** Adjuntos de un mensaje: las imagenes en linea y los PDF como tarjeta. */
export function MessageAttachments({ attachments }: MessageAttachmentsProps) {
  if (attachments.length === 0) return null;

  return (
    <ul className="mt-1 flex flex-wrap gap-2">
      {attachments.map((attachment) => (
        <li key={attachment.id}>
          {isImageAttachment(attachment) ? (
            <a
              href={attachment.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Abrir ${attachment.name}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={attachment.url}
                alt={attachment.name}
                loading="lazy"
                className="border-line max-h-72 max-w-full rounded-lg border object-contain"
              />
            </a>
          ) : (
            <a
              href={attachment.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-surface-input border-line hover:bg-surface-hover flex max-w-72 items-center gap-2 rounded-lg border px-3 py-2"
            >
              <FileIcon size={20} className="text-content-subtle shrink-0" />
              <span className="min-w-0">
                <span className="text-content block truncate text-sm font-medium">
                  {attachment.name}
                </span>
                <span className="text-content-subtle block text-[11px]">
                  {formatFileSize(attachment.size)}
                </span>
              </span>
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}
