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
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { CharacterCounter } from "@/components/ui/CharacterCounter";
import { FieldError } from "@/components/ui/FieldError";
import { FormAlert } from "@/components/ui/FormAlert";
import { ModalShell } from "@/components/ui/ModalShell";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { cn } from "@/lib/cn";

import { DeleteServerModal } from "../DeleteServerModal";
import { BannerPresetPicker } from "./BannerPresetPicker";
import { ServerIdentityEditor } from "./ServerIdentityEditor";
import { useServerSettingsForm } from "./useServerSettingsForm";

const TITLE_ID = "server-settings-title";
const NAME_INPUT_ID = "server-settings-name";
const SETTINGS_MODAL_WIDTH = 660;

interface ServerSettingsModalProps {
  server: ServerSummary;
  isOwner: boolean;
  onClose: () => void;
  onUpdated: (server: ServerSummary) => void;
  onDeleted: () => void;
}

export function ServerSettingsModal({
  server,
  isOwner,
  onClose,
  onUpdated,
  onDeleted,
}: ServerSettingsModalProps) {
  const form = useServerSettingsForm({ server, onUpdated });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void form.submit();
  }

  return (
    <>
      <ModalShell
        onClose={onClose}
        labelledBy={TITLE_ID}
        maxWidth={SETTINGS_MODAL_WIDTH}
      >
        <div className="flex max-h-[95dvh] flex-col sm:flex-row">
          <nav className="border-line bg-surface-raised flex shrink-0 flex-col border-b px-3 py-8 sm:w-56 sm:border-r sm:border-b-0">
            <p className="text-content-subtle mb-1 truncate px-3 text-xs font-bold tracking-wider uppercase">
              {server.name}
            </p>
            <button
              type="button"
              className="bg-surface-input text-content mt-1 cursor-default rounded-lg px-3 py-2 text-left text-sm font-semibold"
            >
              Perfil del servidor
            </button>

            {isOwner ? (
              <>
                <div className="border-line mx-3 mt-6 mb-2 border-t" />
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="text-danger hover:bg-danger/10 cursor-pointer rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors"
                >
                  Eliminar servidor
                </button>
              </>
            ) : null}
          </nav>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="px-7 pt-8 pb-2">
              <h2
                id={TITLE_ID}
                className="font-display text-content mb-1 text-xl font-bold"
              >
                Perfil del servidor
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
        </div>
      </ModalShell>

      {isDeleteModalOpen ? (
        <DeleteServerModal
          serverId={server.id}
          serverName={server.name}
          onClose={() => setIsDeleteModalOpen(false)}
          onDeleted={onDeleted}
        />
      ) : null}
    </>
  );
}
