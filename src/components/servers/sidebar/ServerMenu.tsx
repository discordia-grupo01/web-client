"use client";

import {
  BOOSTS_SECTION_TITLE,
  type BoostLevel,
  boostLevelLabel,
  NOTIFICATION_SETTINGS_MENU_LABEL,
  SERVER_SETTINGS_MENU_DESCRIPTION,
} from "@discordia/client-shared";
import {
  ArrowLeftRight,
  Bell,
  FolderPlus,
  LogOut,
  Plus,
  Settings,
  UserPlus,
} from "lucide-react";

import { BoostActionIcon } from "@/components/boosts/icons/BoostActionIcon";
import { BoostLevelIcon } from "@/components/boosts/icons/BoostLevelIcon";
import { ReportsBadge } from "@/components/reports/ReportsBadge";

import { ServerMenuItem } from "./ServerMenuItem";

interface ServerMenuProps {
  canManageServer: boolean;
  canManageMessages: boolean;
  canManageChannels: boolean;
  canManageRoles: boolean;
  canBanMembers: boolean;
  canInvite: boolean;
  boostLevel: BoostLevel;
  transferLabel: string | null;
  /** `null` si no hay reportes pendientes (o no es moderador). */
  pendingReportsLabel: string | null;
  onClose: () => void;
  onInvite: () => void;
  onNotifications?: () => void;
  onOpenBoosts: () => void;
  onOpenSettings: () => void;
  onCreateChannel: () => void;
  onCreateCategory: () => void;
  onTransfer: () => void;
  onLeave: () => void;
}

export function ServerMenu({
  canManageServer,
  canManageMessages,
  canManageChannels,
  canManageRoles,
  canBanMembers,
  canInvite,
  boostLevel,
  transferLabel,
  pendingReportsLabel,
  onClose,
  onInvite,
  onNotifications,
  onOpenBoosts,
  onOpenSettings,
  onCreateChannel,
  onCreateCategory,
  onTransfer,
  onLeave,
}: ServerMenuProps) {
  /** Cada opción cierra el menú antes de hacer lo suyo. */
  function run(action: () => void) {
    return () => {
      onClose();
      action();
    };
  }

  const canOpenSettings =
    canManageServer || canManageMessages || canManageRoles || canBanMembers;

  return (
    <>
      <button
        type="button"
        aria-label="Cerrar menu"
        onClick={onClose}
        className="fixed inset-0 z-40 cursor-default"
      />
      <div className="bg-surface-raised border-line absolute top-full right-2 left-2 z-50 overflow-hidden rounded-xl border shadow-2xl">
        {canInvite ? (
          <ServerMenuItem
            icon={UserPlus}
            label="Invitar miembros"
            onClick={run(onInvite)}
          />
        ) : null}

        {onNotifications ? (
          <ServerMenuItem
            icon={Bell}
            label={NOTIFICATION_SETTINGS_MENU_LABEL}
            onClick={run(onNotifications)}
          />
        ) : null}

        <ServerMenuItem
          icon={BoostActionIcon}
          label={BOOSTS_SECTION_TITLE}
          onClick={run(onOpenBoosts)}
          trailing={
            <span
              title={boostLevelLabel(boostLevel)}
              aria-label={boostLevelLabel(boostLevel)}
              className="flex shrink-0"
            >
              <BoostLevelIcon level={boostLevel} size={18} bare />
            </span>
          }
        />

        {canOpenSettings ? (
          <ServerMenuItem
            icon={Settings}
            label="Configuración del servidor"
            description={SERVER_SETTINGS_MENU_DESCRIPTION}
            onClick={run(onOpenSettings)}
            trailing={
              pendingReportsLabel ? (
                <ReportsBadge label={pendingReportsLabel} />
              ) : null
            }
          />
        ) : null}

        {canManageChannels ? (
          <>
            <ServerMenuItem
              icon={Plus}
              label="Crear canal"
              onClick={run(onCreateChannel)}
            />
            <ServerMenuItem
              icon={FolderPlus}
              label="Crear categoría"
              onClick={run(onCreateCategory)}
            />
          </>
        ) : null}

        {transferLabel ? (
          <ServerMenuItem
            icon={ArrowLeftRight}
            label={transferLabel}
            onClick={run(onTransfer)}
          />
        ) : null}

        <ServerMenuItem
          icon={LogOut}
          label="Abandonar servidor"
          variant="danger"
          onClick={run(onLeave)}
        />
      </div>
    </>
  );
}
