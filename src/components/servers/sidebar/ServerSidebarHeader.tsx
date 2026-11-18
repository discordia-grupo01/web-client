"use client";

import {
  type BoostSectionTab,
  hasBoostedBadge,
  hasModeratorPermissions,
  type OwnershipTransfer,
  pendingReportsLabel,
  type Role,
  serverBoostCount,
  serverBoostLevel,
  type ServerSummary,
} from "@discordia/client-shared";
import { useCallback, useEffect, useState } from "react";

import { type BanTarget } from "@/components/bans/BanMemberModal";
import { InviteModal } from "@/components/invites/InviteModal";
import { NotificationSettingsModal } from "@/components/notifications/NotificationSettingsModal";
import { LeaveServerModal } from "@/components/servers/LeaveServerModal";
import { ServerSettingsModal } from "@/components/servers/settings/ServerSettingsModal";
import {
  onServerBoostsRequested,
  takeRequestedServerBoosts,
} from "@/utils/serverBoostsRequest";
import { openSettingsSection } from "@/utils/settingsRequest";
import { TransferOwnershipModal } from "@/components/servers/TransferOwnershipModal";
import { useAuth } from "@/contexts/AuthContext";
import { useOptionalNotificationSettings } from "@/contexts/NotificationSettingsContext";
import { useRefreshOnChange } from "@/hooks/useRefreshOnChange";
import { getPendingTransferRequest } from "@/services/ownership-transfers/client";

import { ServerHeaderTrigger } from "./ServerHeaderTrigger";
import { ServerMenu } from "./ServerMenu";

/** Qué modal está abierto. Nunca hay dos a la vez. */
type OpenModal =
  | null
  | "invite"
  | "settings"
  | "boosts"
  | "leave"
  | "transfer"
  | "notifications";

interface ServerSidebarHeaderProps {
  server: ServerSummary;
  isBannerVisible: boolean;
  canManageServer: boolean;
  canManageMessages: boolean;
  canManageChannels: boolean;
  canManageRoles: boolean;
  canBanMembers: boolean;
  canInvite: boolean;
  myRoles: Role[];
  onLeft: () => void;
  onCreateChannel: () => void;
  onCreateCategory: () => void;
  onServerUpdated: (server: ServerSummary) => void;
  /** Abre el perfil de un miembro. */
  onOpenMemberProfile: (userId: string) => void;
  /** Abre la confirmación de baneo de un miembro. */
  onBanMember: (target: BanTarget) => void;
  /** Cambia al banear a alguien: el panel de baneos se recarga para reflejarlo. */
  bansVersion: number;
  /** Se dispara cuando YO acepto una transferencia: paso a ser el nuevo owner. */
  onOwnershipAccepted: () => void;
  /** Se dispara al cerrar el panel de roles: los permisos propios pudieron cambiar. */
  onPermissionsChanged: () => void;
  /** Reportes pendientes de este servidor (0 si no es moderador). */
  pendingReports: number;
  onPendingReportsChanged: () => void;
  /** "Ir al mensaje" desde un reporte: abre el canal y salta al mensaje. */
  onGoToMessage: (channelId: string, messageId: string) => void;
  /** Se expulsó, baneó o silenció a alguien desde un reporte. */
  onMembersChanged: () => void;
}

export function ServerSidebarHeader({
  server,
  isBannerVisible,
  canManageServer,
  canManageMessages,
  canManageChannels,
  canManageRoles,
  canBanMembers,
  canInvite,
  myRoles,
  onLeft,
  onCreateChannel,
  onCreateCategory,
  onServerUpdated,
  onOpenMemberProfile,
  onBanMember,
  bansVersion,
  onOwnershipAccepted,
  onPermissionsChanged,
  pendingReports,
  onPendingReportsChanged,
  onGoToMessage,
  onMembersChanged,
}: ServerSidebarHeaderProps) {
  const { user } = useAuth();
  const notificationSettings = useOptionalNotificationSettings();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [requestedBoostsTab] = useState(() =>
    takeRequestedServerBoosts(server.id),
  );
  const [openModal, setOpenModal] = useState<OpenModal>(
    requestedBoostsTab ? "boosts" : null,
  );
  const [boostsTab, setBoostsTab] = useState<BoostSectionTab>(
    requestedBoostsTab ?? "boost",
  );

  useEffect(
    () =>
      onServerBoostsRequested((serverId, tab) => {
        if (serverId !== server.id) return;
        takeRequestedServerBoosts(serverId);
        setBoostsTab(tab);
        setOpenModal("boosts");
      }),
    [server.id],
  );
  const [pendingTransfer, setPendingTransfer] =
    useState<OwnershipTransfer | null>(null);
  const [isLoadingPendingTransfer, setIsLoadingPendingTransfer] =
    useState(true);
  const isOwner = user !== null && String(user.id) === server.owner_id;
  const canReviewReports = hasModeratorPermissions({ isOwner, roles: myRoles });
  const visiblePendingReports = canReviewReports ? pendingReports : 0;

  /**
   * Se consulta para cualquier miembro (no solo el owner): es la única forma
   * de que el destinatario de una transferencia se entere de que le llegó
   * una, ya que la app no tiene notificaciones en tiempo real todavía. Se
   * comparte entre el ítem de menú (para decidir si mostrarlo) y el modal
   * (para no repetir el fetch).
   */
  useEffect(() => {
    let cancelled = false;
    setIsLoadingPendingTransfer(true);
    getPendingTransferRequest(server.id).then((result) => {
      if (cancelled) return;
      setPendingTransfer(result.ok ? result.transfer : null);
      setIsLoadingPendingTransfer(false);
    });
    return () => {
      cancelled = true;
    };
  }, [server.id]);

  const refreshPendingTransfer = useCallback(async () => {
    const result = await getPendingTransferRequest(server.id);
    setPendingTransfer(result.ok ? result.transfer : null);
  }, [server.id]);

  useRefreshOnChange(
    { resources: ["server", "notifications"], serverId: server.id },
    refreshPendingTransfer,
  );

  const incomingTransfer =
    user !== null &&
    pendingTransfer !== null &&
    pendingTransfer.to_user_id === String(user.id)
      ? pendingTransfer
      : null;
  const showTransfer =
    isOwner || (!isLoadingPendingTransfer && incomingTransfer !== null);
  const transferLabel = !showTransfer
    ? null
    : incomingTransfer
      ? "Responder transferencia de propiedad"
      : "Transferir propiedad";

  function closeModal() {
    setOpenModal(null);
    setBoostsTab("boost");
  }

  function openBoosts(tab: BoostSectionTab) {
    setBoostsTab(tab);
    setOpenModal("boosts");
  }

  const canOpenSettings =
    canManageServer || canManageMessages || canManageRoles || canBanMembers;

  return (
    <div className="border-line relative shrink-0 border-b">
      <ServerHeaderTrigger
        server={server}
        isBannerVisible={isBannerVisible}
        isMenuOpen={isMenuOpen}
        onToggle={() => setIsMenuOpen((prev) => !prev)}
      />

      {isMenuOpen ? (
        <ServerMenu
          canManageServer={canManageServer}
          canManageMessages={canManageMessages}
          canManageChannels={canManageChannels}
          canManageRoles={canManageRoles}
          canBanMembers={canBanMembers}
          canInvite={canInvite}
          boostLevel={serverBoostLevel(server)}
          transferLabel={transferLabel}
          pendingReportsLabel={
            visiblePendingReports > 0
              ? pendingReportsLabel(visiblePendingReports, server.name)
              : null
          }
          onClose={() => setIsMenuOpen(false)}
          onInvite={() => setOpenModal("invite")}
          onNotifications={
            notificationSettings
              ? () => setOpenModal("notifications")
              : undefined
          }
          onOpenBoosts={() => setOpenModal("boosts")}
          onOpenSettings={() => setOpenModal("settings")}
          onCreateChannel={onCreateChannel}
          onCreateCategory={onCreateCategory}
          onTransfer={() => setOpenModal("transfer")}
          onLeave={() => setOpenModal("leave")}
        />
      ) : null}

      {openModal === "invite" && canInvite ? (
        <InviteModal
          serverId={server.id}
          serverName={server.name}
          vanityCode={
            hasBoostedBadge(serverBoostLevel(server))
              ? (server.vanity_code ?? null)
              : null
          }
          boostLevel={serverBoostLevel(server)}
          boostCount={serverBoostCount(server)}
          onClose={closeModal}
          onOpenBoosts={openBoosts}
        />
      ) : null}

      {openModal === "notifications" && notificationSettings ? (
        <NotificationSettingsModal
          scope="server"
          targetId={server.id}
          serverId={server.id}
          name={server.name}
          onClose={closeModal}
        />
      ) : null}

      {(openModal === "settings" && canOpenSettings) ||
      openModal === "boosts" ? (
        <ServerSettingsModal
          server={server}
          openAt={openModal === "boosts" ? "boosts" : undefined}
          openBoostsTab={boostsTab}
          isOwner={isOwner}
          canManageServer={canManageServer}
          canManageMessages={canManageMessages}
          canManageRoles={canManageRoles}
          canBanMembers={canBanMembers}
          canReviewReports={canReviewReports}
          pendingReports={visiblePendingReports}
          currentUserId={user ? String(user.id) : null}
          myRoles={myRoles}
          bansVersion={bansVersion}
          onClose={closeModal}
          onPermissionsChanged={onPermissionsChanged}
          onBuyPoints={() => {
            closeModal();
            openSettingsSection("points");
          }}
          onGoToMessage={(channelId, messageId) => {
            closeModal();
            onGoToMessage(channelId, messageId);
          }}
          onOpenProfile={(userId) => {
            closeModal();
            onOpenMemberProfile(userId);
          }}
          onBanMember={onBanMember}
          onPendingReportsChanged={onPendingReportsChanged}
          onMembersChanged={onMembersChanged}
          onUpdated={(updated) => {
            closeModal();
            onServerUpdated(updated);
          }}
          onDeleted={() => {
            closeModal();
            onLeft();
          }}
        />
      ) : null}

      {openModal === "leave" ? (
        <LeaveServerModal
          serverId={server.id}
          serverName={server.name}
          isOwner={isOwner}
          onClose={closeModal}
          onLeft={onLeft}
        />
      ) : null}

      {openModal === "transfer" ? (
        <TransferOwnershipModal
          serverId={server.id}
          serverName={server.name}
          isOwner={isOwner}
          currentUserId={user ? String(user.id) : null}
          pendingTransfer={pendingTransfer}
          isLoadingPendingTransfer={isLoadingPendingTransfer}
          onPendingTransferChange={setPendingTransfer}
          onClose={closeModal}
          onOwnershipAccepted={() => {
            closeModal();
            onOwnershipAccepted();
          }}
        />
      ) : null}
    </div>
  );
}
