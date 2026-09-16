"use client";

import { AlertCircle, Hash, Volume2, X } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import type { Category } from "@/services/categories/types";
import { createChannelRequest } from "@/services/channels/client";
import type { Channel } from "@/services/channels/types";
import { cn } from "@/lib/cn";

const MAX_NAME = 100;

interface CreateChannelModalProps {
  serverId: string;
  categories: Category[];
  defaultCategoryId?: string | null;
  onClose: () => void;
  onCreated: (channel: Channel) => void;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="text-danger mt-1.5 flex items-center gap-1.5 text-xs">
      <AlertCircle size={13} />
      <span>{message}</span>
    </div>
  );
}

export function CreateChannelModal({
  serverId,
  categories,
  defaultCategoryId = null,
  onClose,
  onCreated,
}: CreateChannelModalProps) {
  const [kind, setKind] = useState<"text" | "voice">("text");
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState(defaultCategoryId ?? "");
  const [nameError, setNameError] = useState("");
  const [globalError, setGlobalError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trimmed = name.trim();
  const canSubmit =
    trimmed.length > 0 && trimmed.length <= MAX_NAME && !isSubmitting;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNameError("");
    setGlobalError("");

    if (!trimmed) {
      setNameError("Ingresá un nombre para el canal.");
      return;
    }

    setIsSubmitting(true);
    const result = await createChannelRequest(serverId, {
      name: trimmed,
      kind,
      categoryId: categoryId || undefined,
    });
    setIsSubmitting(false);

    if (!result.ok) {
      if (result.fieldErrors?.name) setNameError(result.fieldErrors.name);
      if (!result.fieldErrors) setGlobalError(result.message);
      return;
    }

    onCreated(result.channel);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm sm:p-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="border-line-strong relative flex w-full flex-col overflow-hidden rounded-[20px] border shadow-[0_32px_80px_rgba(0,0,0,0.55)]"
        style={{
          maxWidth: 440,
          maxHeight: "95dvh",
          background: "var(--bg-modal)",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="bg-surface-input text-content-subtle border-line absolute top-4 right-4 z-10 flex size-8 items-center justify-center rounded-full border transition-transform hover:scale-110"
        >
          <X size={14} />
        </button>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-7 pt-8 pb-2">
            <h2 className="font-display text-content mb-1 text-xl font-bold">
              Crear Canal
            </h2>
            <p className="text-content-muted text-sm leading-relaxed">
              Agrega un canal de texto o voz al servidor.
            </p>
          </div>

          <div className="space-y-5 px-7 py-6">
            {globalError ? (
              <div className="border-danger/30 bg-danger/10 text-danger flex items-start gap-3 rounded-xl border px-4 py-3 text-sm">
                <AlertCircle size={16} />
                <span>{globalError}</span>
              </div>
            ) : null}

            <div>
              <label className="text-content-subtle mb-1.5 block text-xs font-bold tracking-wider uppercase">
                Tipo de canal
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setKind("text")}
                  className={cn(
                    "border-line rounded-xl border px-3 py-3 text-left transition-colors",
                    kind === "text"
                      ? "border-accent-strong bg-accent/10"
                      : "hover:bg-surface-hover",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Hash size={16} className="text-content-subtle" />
                    <span className="text-content text-sm font-semibold">
                      Texto
                    </span>
                  </div>
                  <p className="text-content-subtle mt-0.5 text-xs">
                    Para mensajes y links
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setKind("voice")}
                  className={cn(
                    "border-line rounded-xl border px-3 py-3 text-left transition-colors",
                    kind === "voice"
                      ? "border-accent-strong bg-accent/10"
                      : "hover:bg-surface-hover",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Volume2 size={16} className="text-content-subtle" />
                    <span className="text-content text-sm font-semibold">
                      Voz
                    </span>
                  </div>
                  <p className="text-content-subtle mt-0.5 text-xs">
                    Para charlar en tiempo real
                  </p>
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="channel-name"
                className="text-content-subtle mb-1.5 block text-xs font-bold tracking-wider uppercase"
              >
                Nombre del canal
              </label>
              <div
                className={cn(
                  "bg-surface-input flex items-center gap-1.5 rounded-xl border px-4 py-3 transition-colors",
                  nameError ? "border-danger" : "border-line",
                )}
              >
                <span className="text-content-subtle">#</span>
                <input
                  id="channel-name"
                  type="text"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setNameError("");
                    setGlobalError("");
                  }}
                  placeholder="mi-nuevo-canal"
                  maxLength={MAX_NAME + 10}
                  autoFocus
                  className="text-content min-w-0 flex-1 border-none bg-transparent text-sm outline-none"
                />
              </div>
              <FieldError message={nameError} />
            </div>

            <div>
              <label
                htmlFor="channel-category"
                className="text-content-subtle mb-1.5 block text-xs font-bold tracking-wider uppercase"
              >
                Categoría
              </label>
              <select
                id="channel-category"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                className="bg-surface-input border-line text-content w-full rounded-xl border px-4 py-3 text-sm outline-none"
              >
                <option value="">Sin categoría</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="border-line flex items-center justify-end gap-3 border-t px-7 py-5">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
              isLoading={isSubmitting}
              className="w-auto"
            >
              Crear Canal
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
