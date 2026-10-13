"use client";

import { formatFileSize } from "@discordia/client-shared";

import { File as FileIcon, X } from "lucide-react";
import { useEffect, useState } from "react";

export interface PendingAttachment {
  id: string;
  file: File;
}

function ImageThumb({ file }: { file: File }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" className="size-8 shrink-0 rounded object-cover" />
  ) : (
    <FileIcon size={16} className="text-content-subtle shrink-0" />
  );
}

interface AttachmentChipsProps {
  attachments: PendingAttachment[];
  onRemove: (id: string) => void;
  disabled?: boolean;
}

/** Archivos elegidos y todavia sin enviar. */
export function AttachmentChips({
  attachments,
  onRemove,
  disabled = false,
}: AttachmentChipsProps) {
  if (attachments.length === 0) return null;

  return (
    <ul className="mb-2 flex flex-wrap gap-2" aria-label="Archivos adjuntos">
      {attachments.map(({ id, file }) => (
        <li
          key={id}
          className="bg-surface-input border-line flex max-w-56 items-center gap-2 rounded-lg border px-2.5 py-1.5"
        >
          {file.type.startsWith("image/") ? (
            <ImageThumb file={file} />
          ) : (
            <FileIcon size={16} className="text-content-subtle shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-content truncate text-xs font-medium">
              {file.name}
            </p>
            <p className="text-content-subtle text-[11px]">
              {formatFileSize(file.size)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onRemove(id)}
            disabled={disabled}
            aria-label={`Quitar ${file.name}`}
            className="text-content-subtle hover:text-content flex size-5 shrink-0 cursor-pointer items-center justify-center rounded disabled:cursor-not-allowed disabled:opacity-60"
          >
            <X size={13} />
          </button>
        </li>
      ))}
    </ul>
  );
}
