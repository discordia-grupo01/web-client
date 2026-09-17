"use client";

import { Pencil, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";

const MAX_CUSTOM_STATUS = 64;

interface CustomStatusEditorProps {
  statusText: string;
  onSave: (text: string) => Promise<boolean>;
  onClear: () => Promise<boolean>;
}

/**
 * Edición inline del estado personalizado del perfil propio (CA1/CA3 de
 * "Estado personalizado"): texto corto de hasta 64 caracteres, con opción de
 * borrarlo. A diferencia del estado de actividad, esto sí pega contra un
 * endpoint real (`PUT`/`DELETE /v1/me/status`).
 */
export function CustomStatusEditor({
  statusText,
  onSave,
  onClear,
}: CustomStatusEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(statusText);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  function startEditing() {
    setDraft(statusText);
    setIsEditing(true);
  }

  async function handleSave() {
    const trimmed = draft.trim();
    if (!trimmed) {
      setIsEditing(false);
      return;
    }
    setIsSubmitting(true);
    const ok = await onSave(trimmed);
    setIsSubmitting(false);
    if (ok) setIsEditing(false);
  }

  async function handleClear() {
    setIsSubmitting(true);
    const ok = await onClear();
    setIsSubmitting(false);
    if (ok) setIsEditing(false);
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <SectionLabel>Estado personalizado</SectionLabel>
        {!isEditing && statusText ? (
          <button
            type="button"
            onClick={handleClear}
            disabled={isSubmitting}
            aria-label="Quitar estado personalizado"
            title="Quitar estado personalizado"
            className="text-content-subtle hover:text-danger flex cursor-pointer items-center gap-1 text-[10px] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={10} />
            Quitar
          </button>
        ) : null}
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <input
            ref={inputRef}
            value={draft}
            onChange={(event) =>
              setDraft(event.target.value.slice(0, MAX_CUSTOM_STATUS))
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") handleSave();
              if (event.key === "Escape") setIsEditing(false);
            }}
            placeholder="¿Qué estás haciendo?"
            disabled={isSubmitting}
            className="bg-surface-input border-line text-content placeholder:text-content-subtle focus:border-accent w-full rounded-lg border px-3 py-2 text-sm outline-none disabled:opacity-60"
          />
          <div className="flex items-center justify-between">
            <span className="text-content-subtle font-mono text-[11px] tabular-nums">
              {draft.length}/{MAX_CUSTOM_STATUS}
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsEditing(false)}
                disabled={isSubmitting}
                className="w-auto"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                isLoading={isSubmitting}
                className="w-auto"
              >
                Guardar
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={startEditing}
          className="bg-surface-input border-line hover:border-line-strong flex w-full cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors"
        >
          {statusText ? (
            <span className="text-content-muted flex-1 truncate text-sm">
              {statusText}
            </span>
          ) : (
            <span className="text-content-subtle flex-1 text-sm">
              Añadir un estado personalizado...
            </span>
          )}
          <Pencil size={11} className="text-content-subtle shrink-0" />
        </button>
      )}
    </div>
  );
}
