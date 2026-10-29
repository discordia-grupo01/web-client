"use client";

import {
  ALLOWED_SERVER_ICON_TYPES,
  formatImageTypes,
  MAX_ICON_FILE_MB,
  MAX_NAME,
  SERVER_NAME_LABEL,
  SERVER_NAME_PLACEHOLDER,
  type ServerSummary,
  WORD_FILTER_TITLE,
} from "@discordia/client-shared";
import {
  Ban,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
  Pencil,
  Trash2,
} from "lucide-react";
import { useState, type FormEvent } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { CharacterCounter } from "@/components/ui/CharacterCounter";
import { FieldError } from "@/components/ui/FieldError";
import { FormAlert } from "@/components/ui/FormAlert";
import { ModalShell } from "@/components/ui/ModalShell";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { cn } from "@/lib/cn";
import { serverIconSrc } from "@/utils/image-urls";

import { DeleteServerModal } from "../DeleteServerModal";
import { BannerPresetPicker } from "./BannerPresetPicker";
import { ServerIdentityEditor } from "./ServerIdentityEditor";
import { useServerSettingsForm } from "@/components/servers/hooks/useServerSettingsForm";
import { WordFilterSection } from "./WordFilterSection";

const TITLE_ID = "server-settings-title";
const NAME_INPUT_ID = "server-settings-name";
const SETTINGS_MODAL_WIDTH = 660;

type SettingsSection = "profile" | "words";

/** Por debajo de `sm` se ve el menu o la seccion, no los dos a la vez. */
type MobileView = "menu" | "section";

interface ServerSettingsModalProps {
  server: ServerSummary;
  isOwner: boolean;
  /** "Perfil del servidor" (nombre, icono, banner). */
  canManageServer: boolean;
  /** "Palabras prohibidas". */
  canManageMessages: boolean;
  onClose: () => void;
  onUpdated: (server: ServerSummary) => void;
  onDeleted: () => void;
}

export function ServerSettingsModal({
  server,
  isOwner,
  canManageServer,
  canManageMessages,
  onClose,
  onUpdated,
  onDeleted,
}: ServerSettingsModalProps) {
  const form = useServerSettingsForm({ server, onUpdated });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [section, setSection] = useState<SettingsSection>(
    canManageServer ? "profile" : "words",
  );
  const [mobileView, setMobileView] = useState<MobileView>("menu");

  function navButton(target: SettingsSection, label: string) {
    const isActive = section === target;
    return (
      <button
        type="button"
        onClick={() => setSection(target)}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "mt-1 cursor-pointer rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors",
          isActive
            ? "bg-surface-input text-content"
            : "text-content-muted hover:bg-surface-input/60 hover:text-content",
        )}
      >
        {label}
      </button>
    );
  }

  function mobileMenuItem(
    target: SettingsSection,
    Icon: LucideIcon,
    label: string,
    description: string,
  ) {
    return (
      <button
        type="button"
        onClick={() => {
          setSection(target);
          setMobileView("section");
        }}
        className="bg-surface-raised border-line text-content-muted flex min-h-16 w-full cursor-pointer items-center gap-4 rounded-2xl border p-4 text-left"
      >
        <span className="bg-surface-input text-info flex size-11 shrink-0 items-center justify-center rounded-xl">
          <Icon size={20} />
        </span>
        <span className="min-w-0 flex-1">
          <strong className="text-content font-display block text-base">
            {label}
          </strong>
          <small className="text-content-subtle">{description}</small>
        </span>
        <ChevronRight size={18} className="text-content-subtle" />
      </button>
    );
  }

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
        isFullScreenOnMobile
      >
        <div className="flex min-h-0 flex-1 flex-col sm:max-h-[95dvh] sm:flex-row">
          <div className="border-line flex h-16 shrink-0 items-center gap-2 border-b px-4 pr-14 sm:hidden">
            {mobileView === "section" ? (
              <button
                type="button"
                onClick={() => setMobileView("menu")}
                aria-label="Volver a configuración"
                className="bg-surface-input text-content-muted flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl"
              >
                <ChevronLeft size={18} />
              </button>
            ) : null}
            <p className="text-content font-display truncate text-lg font-bold">
              {mobileView === "menu"
                ? "Configuración del servidor"
                : section === "words"
                  ? WORD_FILTER_TITLE
                  : "Perfil del servidor"}
            </p>
          </div>

          {mobileView === "menu" ? (
            <nav className="flex-1 space-y-3 overflow-y-auto p-4 sm:hidden">
              <div className="flex flex-col items-center pt-3 pb-4">
                <Avatar
                  name={server.name}
                  src={serverIconSrc(server)}
                  size={80}
                  className="rounded-3xl"
                />
                <p className="text-content font-display mt-3 max-w-full truncate text-lg font-bold">
                  {server.name}
                </p>
              </div>
              {canManageServer
                ? mobileMenuItem(
                    "profile",
                    Pencil,
                    "Perfil del servidor",
                    "Banner, ícono y nombre",
                  )
                : null}
              {canManageMessages
                ? mobileMenuItem(
                    "words",
                    Ban,
                    WORD_FILTER_TITLE,
                    "Mensajes que no se pueden enviar",
                  )
                : null}
              {isOwner ? (
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="bg-surface-raised border-line text-danger flex min-h-16 w-full cursor-pointer items-center gap-4 rounded-2xl border p-4 text-left"
                >
                  <span className="bg-danger/10 flex size-11 shrink-0 items-center justify-center rounded-xl">
                    <Trash2 size={20} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <strong className="font-display block text-base">
                      Eliminar servidor
                    </strong>
                    <small className="text-content-subtle">
                      Esta acción no se puede deshacer
                    </small>
                  </span>
                </button>
              ) : null}
            </nav>
          ) : null}

          <nav className="border-line bg-surface-raised hidden w-56 shrink-0 flex-col border-r px-3 py-8 sm:flex">
            <p className="text-content-subtle mb-1 truncate px-3 text-xs font-bold tracking-wider uppercase">
              {server.name}
            </p>
            {canManageServer
              ? navButton("profile", "Perfil del servidor")
              : null}
            {canManageMessages ? navButton("words", WORD_FILTER_TITLE) : null}

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

          <div
            className={cn(
              "min-h-0 min-w-0 flex-1 flex-col sm:flex",
              mobileView === "section" ? "flex" : "hidden",
            )}
          >
            {section === "words" ? (
              <WordFilterSection serverId={server.id} titleId={TITLE_ID} />
            ) : (
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                <div className="px-4 pt-6 pb-2 sm:px-7 sm:pt-8">
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

                <div className="space-y-6 px-4 py-6 sm:px-7">
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
                        {SERVER_NAME_LABEL}{" "}
                        <span className="text-danger">*</span>
                      </label>
                      <CharacterCounter
                        length={form.name.length}
                        max={MAX_NAME}
                      />
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
                        onChange={(event) =>
                          form.changeName(event.target.value)
                        }
                        placeholder={SERVER_NAME_PLACEHOLDER}
                        maxLength={MAX_NAME + 10}
                        autoFocus
                        className="text-content min-w-0 flex-1 border-none bg-transparent text-sm outline-none"
                      />
                    </div>

                    <FieldError message={form.nameError} />
                  </div>
                </div>

                <div className="border-line flex items-center justify-end gap-3 border-t px-4 py-5 sm:px-7">
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
            )}
          </div>
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
