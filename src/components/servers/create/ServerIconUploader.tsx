"use client";

import {
  ALLOWED_SERVER_ICON_TYPES,
  formatImageTypes,
  MAX_ICON_FILE_MB,
} from "@discordia/client-shared";
import { Camera, Pencil, X } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";

import { FieldError } from "@/components/ui/FieldError";
import { cn } from "@/lib/cn";

import { type PickedServerIcon } from "@/components/servers/hooks/useCreateServerForm";
import { ServerIconPlaceholder } from "./ServerIconPlaceholder";

interface ServerIconUploaderProps {
  serverName: string;
  icon: PickedServerIcon | null;
  error: string;
  onPick: (file: File) => void;
  onRemove: () => void;
}

/** Ícono del servidor nuevo: click o arrastrar para subirlo. */
export function ServerIconUploader({
  serverName,
  icon,
  error,
  onPick,
  onRemove,
}: ServerIconUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const openFilePicker = () => fileInputRef.current?.click();

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) onPick(file);
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="group relative">
        <div
          className="relative cursor-pointer rounded-full"
          onClick={openFilePicker}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          {icon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={icon.previewUrl}
              alt="Ícono del servidor"
              className={cn(
                "size-24 rounded-full border-2 object-cover transition-colors",
                isDragging ? "border-accent-strong" : "border-line-strong",
              )}
            />
          ) : (
            <div
              className={cn(
                "rounded-full",
                isDragging && "ring-accent-strong ring-2",
              )}
            >
              <ServerIconPlaceholder name={serverName} />
            </div>
          )}

          <div
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-full bg-black/55 opacity-0 transition-opacity group-hover:opacity-100",
              isDragging && "opacity-100",
            )}
          >
            <Camera size={20} className="text-white" />
            <span className="text-[10px] font-semibold text-white">
              {isDragging ? "Soltar" : icon ? "Cambiar" : "Subir"}
            </span>
          </div>
        </div>

        {icon ? (
          <button
            type="button"
            onClick={onRemove}
            aria-label="Quitar imagen"
            className="bg-danger absolute -top-1 -right-1 flex size-6 cursor-pointer items-center justify-center rounded-full border-2 transition-transform hover:scale-110"
            style={{ borderColor: "var(--bg-modal)" }}
          >
            <X size={10} className="text-white" />
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={openFilePicker}
          className="bg-surface-input border-line text-content-muted flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all hover:brightness-110"
        >
          <Pencil size={11} />
          {icon ? "Cambiar imagen" : "Subir imagen"}
        </button>
        {icon ? (
          <button
            type="button"
            onClick={onRemove}
            className="text-danger cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-80"
          >
            Quitar
          </button>
        ) : null}
      </div>

      {icon && !error ? (
        <p className="text-content-subtle text-xs">
          {icon.file.name} · {(icon.file.size / (1024 * 1024)).toFixed(1)} MB
        </p>
      ) : null}

      <FieldError message={error} />

      <p className="text-content-subtle text-center text-[11px]">
        {formatImageTypes(ALLOWED_SERVER_ICON_TYPES)} · Máx. {MAX_ICON_FILE_MB}{" "}
        MB
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_SERVER_ICON_TYPES.join(",")}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onPick(file);
          event.target.value = "";
        }}
      />
    </div>
  );
}
