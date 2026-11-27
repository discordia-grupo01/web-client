"use client";

import { useState, type KeyboardEvent } from "react";

import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/FieldError";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { cn } from "@/lib/cn";

interface InlineTextEditorProps {
  initialValue: string;
  maxLength: number;
  label: string;
  hideLabel?: boolean;
  placeholder?: string;
  multiline?: boolean;
  /** Devuelve el mensaje de error, o `null` si guardó y el editor se puede cerrar. */
  onSave: (draft: string) => Promise<string | null>;
  onClose: () => void;
}

const FIELD_CLASSES =
  "bg-surface-input border-line text-content placeholder:text-content-subtle focus:border-accent block w-full rounded-lg border px-3 py-1.5 text-sm outline-none disabled:opacity-60";

const COMPACT_BUTTON_CLASSES =
  "w-auto rounded-lg px-3 py-1.5 text-xs shadow-none";

export function InlineTextEditor({
  initialValue,
  maxLength,
  label,
  hideLabel = false,
  placeholder,
  multiline = false,
  onSave,
  onClose,
}: InlineTextEditorProps) {
  const [draft, setDraft] = useState(initialValue);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function changeDraft(value: string) {
    setDraft(value.slice(0, maxLength));
    setError("");
  }

  async function save() {
    setIsSaving(true);
    const saveError = await onSave(draft);
    setIsSaving(false);
    if (saveError) setError(saveError);
    else onClose();
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
    }
    if (event.key === "Enter" && !multiline) {
      event.preventDefault();
      void save();
    }
  }

  const fieldProps = {
    value: draft,
    onChange: (event: { target: { value: string } }) =>
      changeDraft(event.target.value),
    onKeyDown: handleKeyDown,
    placeholder,
    maxLength,
    disabled: isSaving,
    autoFocus: true,
    "aria-label": label,
    "aria-invalid": Boolean(error),
  };

  return (
    <div>
      {hideLabel ? null : (
        <div className="mb-1.5 flex min-h-6 items-center">
          <SectionLabel>{label}</SectionLabel>
        </div>
      )}
      {multiline ? (
        <textarea
          {...fieldProps}
          rows={3}
          className={cn(FIELD_CLASSES, "resize-none")}
        />
      ) : (
        <input {...fieldProps} className={FIELD_CLASSES} />
      )}
      <FieldError message={error} />
      <div className="mt-1.5 flex items-center justify-end">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSaving}
            className={COMPACT_BUTTON_CLASSES}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={() => void save()}
            isLoading={isSaving}
            className={COMPACT_BUTTON_CLASSES}
          >
            Guardar
          </Button>
        </div>
      </div>
    </div>
  );
}
