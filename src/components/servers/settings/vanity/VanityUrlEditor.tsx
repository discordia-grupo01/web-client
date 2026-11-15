"use client";

import {
  normalizeVanityCode,
  validateVanityCode,
  VANITY_URL_COPY,
} from "@discordia/client-shared";
import { type KeyboardEvent, useId, useState } from "react";

import { vanityLinkPrefix } from "@/components/invites/VanityLinkText";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

interface VanityUrlEditorProps {
  initialCode: string;
  pending: boolean;
  saveError: string;
  onSave: (code: string) => void;
  onCancel?: () => void;
  onEdit: () => void;
}

export function VanityUrlEditor({
  initialCode,
  pending,
  saveError,
  onSave,
  onCancel,
  onEdit,
}: VanityUrlEditorProps) {
  const inputId = useId();
  const [draft, setDraft] = useState(initialCode);
  const validation = validateVanityCode(draft);
  const message = validation ?? saveError;
  const isError = message !== "";

  function submit() {
    if (validation || pending) return;
    onSave(normalizeVanityCode(draft));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    // Está dentro del formulario del perfil: Enter no tiene que guardarlo.
    if (event.key !== "Enter") return;
    event.preventDefault();
    submit();
  }

  return (
    <div className="space-y-2">
      <label
        htmlFor={inputId}
        className="text-content-muted block text-xs font-bold tracking-wider uppercase"
      >
        {VANITY_URL_COPY.title}
      </label>
      <div className="flex flex-wrap gap-2">
        <div
          className={cn(
            "bg-surface-input flex h-11 min-w-0 flex-1 items-center overflow-hidden rounded-xl border",
            isError ? "border-danger" : "border-line",
          )}
        >
          <span className="text-content-subtle pr-1 pl-3.5 text-sm whitespace-nowrap">
            {vanityLinkPrefix()}
          </span>
          <input
            id={inputId}
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value.toLowerCase());
              onEdit();
            }}
            onKeyDown={handleKeyDown}
            aria-invalid={isError}
            aria-describedby={`${inputId}-help`}
            autoComplete="off"
            spellCheck={false}
            className="text-content h-full min-w-0 flex-1 bg-transparent pr-3 text-sm font-semibold outline-none"
          />
        </div>
        <Button
          type="button"
          onClick={submit}
          disabled={validation !== undefined}
          isLoading={pending}
          className="w-auto"
        >
          {VANITY_URL_COPY.save}
        </Button>
        {onCancel ? (
          <Button
            type="button"
            variant="secondary"
            disabled={pending}
            onClick={onCancel}
            className="w-auto"
          >
            Cancelar
          </Button>
        ) : null}
      </div>
      <p
        id={`${inputId}-help`}
        className={cn(
          "text-xs",
          isError ? "text-danger" : "text-content-subtle",
        )}
      >
        {isError ? message : VANITY_URL_COPY.help}
      </p>
    </div>
  );
}
