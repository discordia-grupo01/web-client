"use client";

import {
  decodeMentions,
  EDIT_MESSAGE_HINT,
  validateMessageContent,
} from "@discordia/client-shared";

import { useId, useRef, useState, type KeyboardEvent } from "react";

import { useMentionDraft } from "@/components/messages/hooks/useMentionDraft";

import { MentionSuggestions } from "./MentionSuggestions";
import { MessageEditor, type MessageEditorHandle } from "./MessageEditor";
import { useMessageMentions } from "@/contexts/MentionsContext";

interface MessageEditFormProps {
  initialContent: string;
  hasAttachments?: boolean;
  onSave: (content: string) => void;
  onCancel: () => void;
  isSaving?: boolean;
  error?: string | null;
}

/** Editor inline para editar un mensaje: Enter guarda, Esc cancela. */
export function MessageEditForm({
  initialContent,
  hasAttachments = false,
  onSave,
  onCancel,
  isSaving = false,
  error = null,
}: MessageEditFormProps) {
  const { sources, resolveMention } = useMessageMentions();
  const editorRef = useRef<MessageEditorHandle>(null);
  const suggestionsId = useId();
  // El mensaje trae `<@id>`; se edita como `@Nombre` y se vuelve a codificar al guardar.
  const [initial] = useState(() =>
    decodeMentions(
      initialContent,
      (kind, id) => resolveMention?.(kind, id)?.name ?? null,
    ),
  );
  const draft = useMentionDraft({
    editorRef,
    sources,
    initialText: initial.text,
    initialPicked: initial.picked,
  });

  function save() {
    if (isSaving || validateMessageContent(draft.encoded, hasAttachments))
      return;
    onSave(draft.encoded.trim());
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (draft.handleSuggestionKey(event)) return;
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      save();
    } else if (event.key === "Escape") {
      onCancel();
    }
  }

  return (
    <div className="relative">
      {draft.isOpen ? (
        <MentionSuggestions
          id={suggestionsId}
          query={draft.query}
          candidates={draft.candidates}
          selectedIndex={draft.selectedIndex}
          onPick={draft.pick}
        />
      ) : null}
      <MessageEditor
        ref={editorRef}
        value={draft.text}
        segments={draft.segments}
        onChange={draft.handleChange}
        onCursorMove={draft.handleCursorMove}
        onKeyDown={handleKeyDown}
        aria-controls={draft.isOpen ? suggestionsId : undefined}
        aria-autocomplete="list"
        autoFocus
        aria-invalid={error ? true : undefined}
        className="bg-surface-input border-accent text-content w-full rounded-md border p-2 text-sm outline-none"
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
