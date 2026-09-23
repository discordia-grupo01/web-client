"use client";

import {
  ALLOWED_SERVER_ICON_TYPES,
  formatImageTypes,
  MAX_ICON_FILE_MB,
  MAX_NAME,
  SERVER_NAME_LABEL,
  SERVER_NAME_PLACEHOLDER,
  type ServerSummary,
} from "@discordia/client-shared";
import { type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { CharacterCounter } from "@/components/ui/character-counter";
import { FieldError } from "@/components/ui/field-error";
import { FormAlert } from "@/components/ui/form-alert";
import { ModalShell } from "@/components/ui/modal-shell";
import { SectionLabel } from "@/components/ui/section-label";
import { cn } from "@/lib/cn";

import { BannerPresetPicker } from "./banner-preset-picker";
import { ServerIdentityEditor } from "./server-identity-editor";
import { useServerSettingsForm } from "./use-server-settings-form";

const TITLE_ID = "server-settings-title";
const NAME_INPUT_ID = "server-settings-name";

interface ServerSettingsModalProps {
  server: ServerSummary;
  onClose: () => void;
  onUpdated: (server: ServerSummary) => void;
}

/**
 * Configuracion general del servidor: nombre, icono y banner. Solo lo abre
 * quien puede editar (hoy el backend acepta unicamente al owner, ver
 * `services/servers/service.ts`); si igual llegara un 403, el formulario lo
 * muestra como error general y no persiste nada.
 */
export function ServerSettingsModal({
  server,
  onClose,
  onUpdated,
}: ServerSettingsModalProps) {
  const form = useServerSettingsForm({ server, onUpdated });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void form.submit();
  }

  return (
    <ModalShell onClose={onClose} labelledBy={TITLE_ID}>
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
        <div className="px-7 pt-8 pb-2">
          <h2
            id={TITLE_ID}
            className="font-display text-content mb-1 text-xl font-bold"
          >
            Configuración del servidor
          </h2>
          <p className="text-content-muted text-sm leading-relaxed">
            Actualizá la identidad visual de tu comunidad.
          </p>
        </div>

        <div className="space-y-6 px-7 py-6">
          <FormAlert message={form.globalError} />

          <div>
            <SectionLabel>Identidad del servidor</SectionLabel>
            <div className="mt-2">
              <ServerIdentityEditor
                serverName={form.name || server.name}
                iconSrc={form.iconPreviewSrc}
                bannerSrc={form.bannerPreviewSrc}
                bannerGradient={form.bannerPreviewGradient}
                hasBanner={form.hasBanner}
                onPickIcon={form.pickIcon}
                onPickBanner={form.pickBanner}
                onRemoveBanner={form.removeBanner}
              />
            </div>
            <FieldError message={form.iconError} />
            <FieldError message={form.bannerError} />
            {/* Los formatos y el tope salen de las mismas constantes que usa
                `validateServerIcon`, para que el cartel no pueda mentir. */}
            <p className="text-content-subtle mt-2 text-[11px]">
              {formatImageTypes(ALLOWED_SERVER_ICON_TYPES)} · Máx.{" "}
              {MAX_ICON_FILE_MB} MB
            </p>
          </div>

          <BannerPresetPicker
            selectedId={form.selectedPresetId}
            onSelect={form.choosePreset}
          />

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label
                htmlFor={NAME_INPUT_ID}
                className="text-content-subtle text-xs font-bold tracking-wider uppercase"
              >
                {SERVER_NAME_LABEL} <span className="text-danger">*</span>
              </label>
              <CharacterCounter length={form.name.length} max={MAX_NAME} />
            </div>

            <div
              className={cn(
                "bg-surface-input flex items-center rounded-xl border px-4 py-3 transition-colors",
                form.nameError ? "border-danger" : "border-line",
              )}
            >
              <input
                id={NAME_INPUT_ID}
                type="text"
                value={form.name}
                onChange={(event) => form.changeName(event.target.value)}
                placeholder={SERVER_NAME_PLACEHOLDER}
                // Un poco mas que `MAX_NAME` a proposito: si el navegador
                // cortara justo en el limite, el contador nunca marcaria en
                // rojo y el usuario no se enteraria de que se paso.
                maxLength={MAX_NAME + 10}
                autoFocus
                className="text-content min-w-0 flex-1 border-none bg-transparent text-sm outline-none"
              />
            </div>

            <FieldError message={form.nameError} />
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
            disabled={!form.canSubmit}
            isLoading={form.isSubmitting}
            className="w-auto"
          >
            Guardar cambios
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}
