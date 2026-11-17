"use client";

import {
  ALLOWED_EMOJI_TYPES,
  EMOJI_NAME_MAX,
  EMOJI_UPLOAD_COPY,
  emojiFileDetail,
  emojiLabel,
  formatFileSize,
  isAnimatedEmojiType,
  type ServerEmoji,
  suggestEmojiName,
} from "@discordia/client-shared";
import { ImagePlus } from "lucide-react";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/FieldError";
import { FormAlert } from "@/components/ui/FormAlert";
import { ModalShell } from "@/components/ui/ModalShell";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { cn } from "@/lib/cn";

import { useUploadEmoji } from "./hooks/useUploadEmoji";

interface UploadEmojiModalProps {
  serverId: string;
  onClose: () => void;
  onUploaded: (emoji: ServerEmoji) => void;
}

export function UploadEmojiModal({
  serverId,
  onClose,
  onUploaded,
}: UploadEmojiModalProps) {
  const titleId = useId();
  const nameId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [name, setName] = useState("");
  const { upload, isUploading, errors, clearErrors } = useUploadEmoji(serverId);

  useEffect(() => {
    if (file === null) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function handlePick(picked: File | undefined) {
    if (!picked) return;
    clearErrors();
    setFile(picked);
    // Solo propone si el campo esta vacio: no pisa lo que ya escribio.
    setName((current) => current || suggestEmojiName(picked.name));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const emoji = await upload(name, file);
    if (emoji) onUploaded(emoji);
  }

  return (
    <ModalShell onClose={onClose} maxWidth={460} labelledBy={titleId}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-7 py-7">
        <div>
          <h2
            id={titleId}
            className="font-display text-content mb-1 text-xl font-bold"
          >
            {EMOJI_UPLOAD_COPY.title}
          </h2>
          <p className="text-content-muted text-sm leading-relaxed">
            {EMOJI_UPLOAD_COPY.description}
          </p>
        </div>

        <FormAlert message={errors.form} />

        <div>
          <SectionLabel>{EMOJI_UPLOAD_COPY.imageLabel}</SectionLabel>
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_EMOJI_TYPES.join(",")}
            onChange={(event) => handlePick(event.target.files?.[0])}
            className="hidden"
          />

          {file === null ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "bg-surface-input text-content-muted hover:border-line-strong mt-2 flex w-full cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-6 text-sm transition-colors",
                errors.image ? "border-danger" : "border-line",
              )}
            >
              <ImagePlus size={22} />
              <span>{EMOJI_UPLOAD_COPY.pickImage}</span>
            </button>
          ) : (
            <div
              className={cn(
                "bg-surface-input mt-2 flex items-center gap-3 rounded-xl border p-3",
                errors.image ? "border-danger" : "border-line",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- es un object URL del archivo que acaba de elegir */}
              <img
                src={previewUrl ?? ""}
                alt=""
                className="size-11 shrink-0 rounded object-contain"
              />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-content truncate text-sm font-semibold">
                  {file.name}
                </span>
                <span className="text-content-subtle text-xs">
                  {emojiFileDetail(
                    formatFileSize(file.size),
                    file.type,
                    isAnimatedEmojiType(file.type),
                  )}
                </span>
              </div>
              <Button
                type="button"
                variant="secondary"
                className="w-auto shrink-0 px-3 py-2"
                onClick={() => fileInputRef.current?.click()}
              >
                {EMOJI_UPLOAD_COPY.changeImage}
              </Button>
            </div>
          )}
          <FieldError message={errors.image} />
        </div>

        <div>
          <SectionLabel>
            <label htmlFor={nameId}>{EMOJI_UPLOAD_COPY.nameLabel}</label>
          </SectionLabel>
          <div
            className={cn(
              "bg-surface-input focus-within:border-accent mt-2 flex items-center gap-0.5 rounded-xl border px-4 py-3 transition-colors",
              errors.name ? "border-danger" : "border-line",
            )}
          >
            <span className="text-content-subtle text-sm">:</span>
            <input
              id={nameId}
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={EMOJI_NAME_MAX}
              autoComplete="off"
              aria-invalid={errors.name ? true : undefined}
              className="text-content min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
            <span className="text-content-subtle text-sm">:</span>
          </div>
          <p className="text-content-subtle mt-1.5 text-xs">
            {EMOJI_UPLOAD_COPY.nameHelp}
          </p>
          <FieldError message={errors.name} />
        </div>

        {previewUrl && name ? (
          <div>
            <SectionLabel>{EMOJI_UPLOAD_COPY.previewLabel}</SectionLabel>
            <p className="bg-surface-input border-line text-content-subtle mt-2 flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs">
              {/* eslint-disable-next-line @next/next/no-img-element -- mismo object URL del preview */}
              <img
                src={previewUrl}
                alt=""
                className="size-5.5 shrink-0 object-contain"
              />
              <span className="truncate">{emojiLabel(name)}</span>
            </p>
          </div>
        ) : null}

        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            {EMOJI_UPLOAD_COPY.cancel}
          </Button>
          <Button type="submit" isLoading={isUploading}>
            {EMOJI_UPLOAD_COPY.submit}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}
