"use client";

import {
  canViewChannelWithDraft,
  type Channel,
  CHANNEL_PERMISSIONS_TITLE,
  CHANNEL_SETTINGS_OVERVIEW_SECTION,
  CHANNEL_SETTINGS_PERMISSIONS_SECTION,
  channelPermissionsSubtitle,
  DELETE_CHANNEL_LABEL,
  LOSE_CHANNEL_ACCESS_BODY,
  LOSE_CHANNEL_ACCESS_CONFIRM,
  LOSE_CHANNEL_ACCESS_TITLE,
  type Role,
  SAVE_CHANGES_LABEL,
} from "@discordia/client-shared";

import { EyeOff, Hash, Volume2 } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FormAlert } from "@/components/ui/FormAlert";
import { ModalShell } from "@/components/ui/ModalShell";
import { cn } from "@/lib/cn";
import { useChannelOverrides } from "@/hooks/useChannelOverrides";

import {
  ChannelOverviewSection,
  useChannelOverviewForm,
} from "./ChannelOverviewSection";
import { ChannelPermissionsSection } from "./ChannelPermissionsSection";

export type ChannelSettingsSection = "overview" | "permissions";

const TITLE_ID = "channel-settings-title";
const SETTINGS_MODAL_WIDTH = 860;

interface ChannelSettingsModalProps {
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
 * Configuracion del canal con el mismo armado que la del servidor: secciones
 * en el lateral y un solo "Guardar cambios" para las dos.
 */
export function ChannelSettingsModal({
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
}: ChannelSettingsModalProps) {
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

  const hasOverviewChanges = canManageChannel && overview.hasChanges;
  const hasChanges = hasOverviewChanges || overrides.hasChanges;
  const isSaving = overrides.isSaving || overview.isSaving;
  const channelName = overview.name.trim() || channel.name;

  const [isConfirmingLoss, setIsConfirmingLoss] = useState(false);
  const [saveError, setSaveError] = useState("");

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
    if (hasOverviewChanges && !overview.validate()) {
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

    if (hasOverviewChanges) {
      const result = await overview.save();
      if (!result.ok) {
        setSection("overview");
        if (result.message) setSaveError(result.message);
        return;
      }
      onChannelUpdated(result.channel);
    }

    if (overrides.hasChanges) {
      const failures = await overrides.save();
      if (failures.length > 0) {
        setSection("permissions");
        setSaveError(failures[0].message);
        return;
      }
      onPermissionsSaved();
    }

    onClose();
  }

  const ChannelIcon = channel.kind === "text" ? Hash : Volume2;

  return (
    <>
      <ModalShell
        onClose={onClose}
        labelledBy={TITLE_ID}
        maxWidth={SETTINGS_MODAL_WIDTH}
      >
        <div className="flex max-h-[95dvh] flex-col sm:h-[min(680px,90dvh)] sm:flex-row">
          <nav className="border-line bg-surface-raised flex shrink-0 flex-col border-b px-3 py-6 sm:w-56 sm:border-r sm:border-b-0 sm:py-8">
            <p className="text-content-subtle mb-1 flex items-center gap-1 px-3 text-xs font-bold tracking-wider uppercase">
              <ChannelIcon size={12} className="shrink-0" />
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
                  "mt-1 cursor-pointer rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors",
                  section === item.id
                    ? "bg-surface-input text-content"
                    : "text-content-muted hover:bg-surface-hover",
                )}
              >
                {item.label}
              </button>
            ))}

            {canManageChannel ? (
              <>
                <div className="border-line mx-3 mt-6 mb-2 border-t" />
                <button
                  type="button"
                  onClick={onDelete}
                  className="text-danger hover:bg-danger/10 cursor-pointer rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors"
                >
                  {DELETE_CHANNEL_LABEL}
                </button>
              </>
            ) : null}
          </nav>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="px-7 pt-8 pb-2">
                <h2
                  id={TITLE_ID}
                  className="font-display text-content mb-1 text-xl font-bold"
                >
                  {section === "overview"
                    ? CHANNEL_SETTINGS_OVERVIEW_SECTION
                    : CHANNEL_PERMISSIONS_TITLE}
                </h2>
                <p className="text-content-muted text-sm leading-relaxed">
                  {section === "overview"
                    ? `#${channelName}`
                    : channelPermissionsSubtitle(channelName)}
                </p>
              </div>

              <div className="space-y-6 px-7 py-6">
                <FormAlert message={saveError} />

                {section === "overview" && canManageChannel ? (
                  <ChannelOverviewSection kind={channel.kind} form={overview} />
                ) : null}
                {section === "permissions" && canManagePermissions ? (
                  <ChannelPermissionsSection
                    channelKind={channel.kind}
                    overrides={overrides}
                    serverRoles={serverRoles}
                    actor={actor}
                  />
                ) : null}
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
                type="button"
                onClick={requestSave}
                disabled={!hasChanges || isSaving}
                isLoading={isSaving}
                className="w-auto"
              >
                {SAVE_CHANGES_LABEL}
              </Button>
            </div>
          </div>
        </div>
      </ModalShell>

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
    </>
  );
}
