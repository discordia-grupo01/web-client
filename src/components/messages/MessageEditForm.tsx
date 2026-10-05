"use client";

import {
  EDIT_MESSAGE_HINT,
  validateMessageContent,
} from "@discordia/client-shared";

import { useState, type KeyboardEvent } from "react";

interface MessageEditFormProps {
  initialContent: string;
  onSave: (content: string) => void;
  onCancel: () => void;
  /** Mientras se guarda no se puede volver a guardar. */
  isSaving?: boolean;
  /** Por que fallo el guardado; el formulario sigue abierto con el borrador. */
  error?: string | null;
}

/** Textarea inline para editar un mensaje: Enter guarda, Esc cancela. */
export function MessageEditForm({
  initialContent,
  onSave,
  onCancel,
  isSaving = false,
  error = null,
}: MessageEditFormProps) {
  const [draft, setDraft] = useState(initialContent);

  function save() {
    if (isSaving || validateMessageContent(draft)) return;
    onSave(draft.trim());
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      save();
    } else if (event.key === "Escape") {
      onCancel();
    }
  }

  return (
    <div>
      <textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
        aria-invalid={error ? true : undefined}
        className="bg-surface-input border-accent text-content w-full resize-none rounded-md border p-2 text-sm outline-none"
        style={{ minHeight: 56 }}
      />
      {error ? (
        <p role="alert" className="text-danger mt-1 text-xs">
          {error}
        </p>
      ) : null}
      <p className="text-content-subtle mt-1 text-[10px]">
        {EDIT_MESSAGE_HINT}
      </p>
    </div>
  );
}
