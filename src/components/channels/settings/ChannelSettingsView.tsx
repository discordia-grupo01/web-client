"use client";

import {
  canViewChannelWithDraft,
  type Channel,
  CHANNEL_PERMISSIONS_SAVED,
  CHANNEL_SETTINGS_OVERVIEW_SECTION,
  CHANNEL_SETTINGS_PERMISSIONS_SECTION,
  DELETE_CHANNEL_LABEL,
  LOSE_CHANNEL_ACCESS_BODY,
  LOSE_CHANNEL_ACCESS_CONFIRM,
  LOSE_CHANNEL_ACCESS_TITLE,
  type Role,
} from "@discordia/client-shared";

import { EyeOff, Hash, Trash2, Volume2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FormAlert } from "@/components/ui/FormAlert";
import { UnsavedChangesBar } from "@/components/ui/UnsavedChangesBar";
import { cn } from "@/lib/cn";
import { useChannelOverrides } from "@/services/channel-permissions/useChannelOverrides";

import {
  ChannelOverviewSection,
  useChannelOverviewForm,
} from "./ChannelOverviewSection";
import { ChannelPermissionsSection } from "./ChannelPermissionsSection";

export type ChannelSettingsSection = "overview" | "permissions";

const WARNING_MS = 650;
const TOAST_MS = 2500;

interface ChannelSettingsViewProps {
  channel: Channel;
  categoryName: string | null;
  initialSection: ChannelSettingsSection;
  /** MANAGE_CHANNELS: nombre, tema y eliminar. */
  canManageChannel: boolean;
  /** MANAGE_ROLES: excepciones de permisos del canal. */
  canManagePermissions: boolean;
  isOwner: boolean;
  /** Roles del usuario actual, @everyone incluido. */
  myRoles: readonly Role[];
  serverRoles: readonly Role[];
  onClose: () => void;
  onChannelUpdated: (channel: Channel) => void;
  /** Se guardaron excepciones: la lista de canales visibles puede cambiar. */
  onPermissionsSaved: () => void;
  onDelete: () => void;
}

/**
 * Configuracion del canal a pantalla completa, como la de Discord: "Vista
 * general" (nombre y tema) y "Permisos" (excepciones por rol). Los cambios de
 * las dos secciones se guardan juntos desde la barra de cambios sin guardar.
 */
export function ChannelSettingsView({
  channel,
  categoryName,
  initialSection,
  canManageChannel,
  canManagePermissions,
  isOwner,
  myRoles,
  serverRoles,
  onClose,
  onChannelUpdated,
  onPermissionsSaved,
  onDelete,
}: ChannelSettingsViewProps) {
  const sections = useMemo(
    () =>
      [
        canManageChannel && {
          id: "overview" as const,
          label: CHANNEL_SETTINGS_OVERVIEW_SECTION,
        },
        canManagePermissions && {
          id: "permissions" as const,
          label: CHANNEL_SETTINGS_PERMISSIONS_SECTION,
        },
      ].filter((section) => section !== false),
    [canManageChannel, canManagePermissions],
  );
  const [section, setSection] = useState<ChannelSettingsSection>(
    sections.some((item) => item.id === initialSection)
      ? initialSection
      : (sections[0]?.id ?? "overview"),
  );

  const everyoneRoleId =
    serverRoles.find((role) => role.is_everyone)?.id ?? null;
  const overview = useChannelOverviewForm(channel);
  const overrides = useChannelOverrides(
    channel.id,
    everyoneRoleId,
    canManagePermissions,
  );

  const actor = useMemo(
    () => ({
      isOwner,
      roles: [...myRoles],
      serverPermissions: myRoles.flatMap((role) => role.permissions),
    }),
    [isOwner, myRoles],
  );

  const hasChanges =
    (canManageChannel && overview.hasChanges) || overrides.hasChanges;
  const isSaving = overrides.isSaving || overview.isSaving;

  const [isWarning, setIsWarning] = useState(false);
  const [isConfirmingLoss, setIsConfirmingLoss] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [toast, setToast] = useState("");
  const warningTimer = useRef<number | undefined>(undefined);

  const tryClose = useCallback(() => {
    if (!hasChanges) {
      onClose();
      return;
    }
    setIsWarning(true);
    window.clearTimeout(warningTimer.current);
    warningTimer.current = window.setTimeout(
      () => setIsWarning(false),
      WARNING_MS,
    );
  }, [hasChanges, onClose]);

  useEffect(() => () => window.clearTimeout(warningTimer.current), []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      if (isConfirmingLoss) {
        setIsConfirmingLoss(false);
        return;
      }
      tryClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isConfirmingLoss, tryClose]);

  function resetAll() {
    overview.reset();
    overrides.reset();
    setSaveError("");
  }

  function losesAccess(): boolean {
    if (!overrides.hasChanges || !overrides.draft || !everyoneRoleId) {
      return false;
    }
    return !canViewChannelWithDraft(
      overrides.draft,
      {
        isOwner,
        serverPermissions: actor.serverPermissions,
        roleIds: myRoles.map((role) => role.id),
      },
      everyoneRoleId,
    );
  }

  function requestSave() {
    setSaveError("");
    if (canManageChannel && overview.hasChanges && !overview.validate()) {
      setSection("overview");
      return;
    }
    if (losesAccess()) {
      setIsConfirmingLoss(true);
      return;
    }
    void save();
  }

  async function save() {
    setIsConfirmingLoss(false);

    if (canManageChannel && overview.hasChanges) {
      const result = await overview.save();
      if (!result.ok) {
        setSection("overview");
        if (result.message) setSaveError(result.message);
        return;
      }
      onChannelUpdated(result.channel);
    }

    if (!overrides.hasChanges) return;
    const failures = await overrides.save();
    if (failures.length > 0) {
      setSection("permissions");
      setSaveError(failures[0].message);
      return;
    }
    setToast(CHANNEL_PERMISSIONS_SAVED);
    onPermissionsSaved();
  }

  const ChannelIcon = channel.kind === "text" ? Hash : Volume2;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={channel.name}
      className="bg-surface fixed inset-0 z-50 flex overflow-hidden"
    >
      <aside className="bg-surface-sunken hidden w-[calc(50%-370px)] min-w-[220px] justify-end md:flex">
        <nav className="w-[220px] px-2 pt-14">
          <p className="text-content-subtle mb-2 flex items-center gap-1 px-2.5 text-[11px] font-bold tracking-wide uppercase">
            <ChannelIcon size={11} className="shrink-0" />
            <span className="truncate">
              {channel.name}
              {categoryName ? ` · ${categoryName}` : ""}
            </span>
          </p>
          {sections.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-current={section === item.id ? "page" : undefined}
              onClick={() => setSection(item.id)}
              className={cn(
                "mb-0.5 w-full cursor-pointer rounded px-2.5 py-1.5 text-left text-sm font-medium transition-colors",
                section === item.id
                  ? "bg-surface-hover text-content"
                  : "text-content-muted hover:bg-surface-hover/60",
              )}
            >
              {item.label}
            </button>
          ))}
          {canManageChannel ? (
            <>
              <div className="bg-line my-2 h-px" />
              <button
                type="button"
                onClick={onDelete}
                className="text-danger hover:bg-surface-hover flex w-full cursor-pointer items-center justify-between rounded px-2.5 py-1.5 text-left text-sm font-medium"
              >
                <span>{DELETE_CHANNEL_LABEL}</span>
                <Trash2 size={14} />
              </button>
            </>
          ) : null}
        </nav>
      </aside>

      <main className="relative flex min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[740px] px-4 pt-14 pb-32 md:px-10">
          <div className="mb-6 flex flex-wrap gap-2 pr-12 md:hidden">
            {sections.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-current={section === item.id ? "page" : undefined}
                onClick={() => setSection(item.id)}
                className={cn(
                  "text-content cursor-pointer rounded-md px-3 py-2 text-sm",
                  section === item.id && "bg-surface-hover",
                )}
              >
                {item.label}
              </button>
            ))}
            {canManageChannel ? (
              <button
                type="button"
                onClick={onDelete}
                className="text-danger cursor-pointer rounded-md px-3 py-2 text-sm"
              >
                {DELETE_CHANNEL_LABEL}
              </button>
            ) : null}
          </div>

          {saveError ? (
            <div className="mb-6">
              <FormAlert message={saveError} />
            </div>
          ) : null}

          {section === "overview" && canManageChannel ? (
            <ChannelOverviewSection kind={channel.kind} form={overview} />
          ) : null}
          {section === "permissions" && canManagePermissions ? (
            <ChannelPermissionsSection
              channelName={overview.name.trim() || channel.name}
              channelKind={channel.kind}
              overrides={overrides}
              serverRoles={serverRoles}
              actor={actor}
            />
          ) : null}
        </div>

        <div className="fixed top-5 right-5 z-10 flex flex-col items-center gap-1 md:right-[max(24px,calc((50%-370px)-72px))]">
          <button
            type="button"
            aria-label="Cerrar configuración"
            onClick={tryClose}
            className="border-content-subtle text-content-muted hover:bg-surface-hover flex size-9 cursor-pointer items-center justify-center rounded-full border-2 transition-colors"
          >
            <X size={16} />
          </button>
          <span className="text-content-subtle text-[10px] font-semibold">
            ESC
          </span>
        </div>
      </main>

      {hasChanges && !isConfirmingLoss ? (
        <UnsavedChangesBar
          isSaving={isSaving}
          isWarning={isWarning}
          onReset={resetAll}
          onSave={requestSave}
        />
      ) : null}

      {toast && !hasChanges ? (
        <div
          role="status"
          className="bg-success fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-2xl"
        >
          {toast}
        </div>
      ) : null}

      {isConfirmingLoss ? (
        <ConfirmDialog
          icon={EyeOff}
          title={LOSE_CHANNEL_ACCESS_TITLE}
          body={LOSE_CHANNEL_ACCESS_BODY}
          confirmLabel={LOSE_CHANNEL_ACCESS_CONFIRM}
          onConfirm={() => void save()}
          onCancel={() => setIsConfirmingLoss(false)}
        />
      ) : null}
    </div>
  );
}
