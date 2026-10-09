"use client";

import { File as FileIcon, X } from "lucide-react";

export interface PendingAttachment {
  id: string;
  file: File;
}

const UNITS = ["B", "KB", "MB", "GB"];

function formatSize(bytes: number): string {
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${unit === 0 ? value : value.toFixed(1)} ${UNITS[unit]}`;
}

interface AttachmentChipsProps {
  attachments: PendingAttachment[];
  onRemove: (id: string) => void;
}

/** Archivos elegidos y todavia sin enviar (maqueta: aun no hay back de adjuntos). */
export function AttachmentChips({
  attachments,
  onRemove,
}: AttachmentChipsProps) {
  if (attachments.length === 0) return null;

  return (
    <ul className="mb-2 flex flex-wrap gap-2" aria-label="Archivos adjuntos">
      {attachments.map(({ id, file }) => (
        <li
          key={id}
          className="bg-surface-input border-line flex max-w-56 items-center gap-2 rounded-lg border px-2.5 py-1.5"
        >
          <FileIcon size={16} className="text-content-subtle shrink-0" />
          <div className="min-w-0">
            <p className="text-content truncate text-xs font-medium">
              {file.name}
            </p>
            <p className="text-content-subtle text-[11px]">
              {formatSize(file.size)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onRemove(id)}
            aria-label={`Quitar ${file.name}`}
            className="text-content-subtle hover:text-content flex size-5 shrink-0 cursor-pointer items-center justify-center rounded"
          >
            <X size={13} />
          </button>
        </li>
      ))}
    </ul>
  );
}
