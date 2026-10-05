"use client";

import {
  type OwnershipTransfer,
  type Role,
  type ServerSummary,
} from "@discordia/client-shared";
import { useEffect, useState } from "react";

import { type BanTarget } from "@/components/bans/BanMemberModal";
import { BansModal } from "@/components/bans/BansModal";
import { InviteModal } from "@/components/invites/InviteModal";
import { RolesModal } from "@/components/roles/RolesModal";
import { LeaveServerModal } from "@/components/servers/LeaveServerModal";
import { ServerSettingsModal } from "@/components/servers/settings/ServerSettingsModal";
import { TransferOwnershipModal } from "@/components/servers/TransferOwnershipModal";
import { useAuth } from "@/services/auth/auth-context";
import { getPendingTransferRequest } from "@/services/ownership-transfers/client";

import { ServerHeaderTrigger } from "./ServerHeaderTrigger";
import { ServerMenu } from "./ServerMenu";

/** Que modal esta abierto. Nunca hay dos a la vez. */
type OpenModal =
  null | "invite" | "settings" | "roles" | "bans" | "leave" | "transfer";

interface ServerSidebarHeaderProps {
  server: ServerSummary;
  isBannerVisible: boolean;
  canManageServer: boolean;
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
  /** Cambia al banear a alguien: el modal de baneos se recarga para reflejarlo. */
  bansVersion: number;
  /** Se dispara cuando YO acepto una transferencia: paso a ser el nuevo owner. */
  onOwnershipAccepted: () => void;
  /** Se dispara al cerrar el modal de roles: los permisos propios pudieron cambiar. */
  onPermissionsChanged: () => void;
}

export function ServerSidebarHeader({
  server,
  isBannerVisible,
  canManageServer,
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
}: ServerSidebarHeaderProps) {
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openModal, setOpenModal] = useState<OpenModal>(null);
  const [pendingTransfer, setPendingTransfer] =
    useState<OwnershipTransfer | null>(null);
  const [isLoadingPendingTransfer, setIsLoadingPendingTransfer] =
    useState(true);
  const isOwner = user !== null && String(user.id) === server.owner_id;

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
  }

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
          canManageChannels={canManageChannels}
          canManageRoles={canManageRoles}
          canBanMembers={canBanMembers}
          canInvite={canInvite}
          transferLabel={transferLabel}
          onClose={() => setIsMenuOpen(false)}
          onInvite={() => setOpenModal("invite")}
          onOpenSettings={() => setOpenModal("settings")}
          onCreateChannel={onCreateChannel}
          onCreateCategory={onCreateCategory}
          onManageRoles={() => setOpenModal("roles")}
          onManageBans={() => setOpenModal("bans")}
          onTransfer={() => setOpenModal("transfer")}
          onLeave={() => setOpenModal("leave")}
        />
      ) : null}

      {openModal === "invite" && canInvite ? (
        <InviteModal
          serverId={server.id}
          serverName={server.name}
          onClose={closeModal}
        />
      ) : null}

      {openModal === "settings" && canManageServer ? (
        <ServerSettingsModal
          server={server}
          isOwner={isOwner}
          onClose={closeModal}
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

      {openModal === "roles" && canManageRoles ? (
        <RolesModal
          serverId={server.id}
          serverName={server.name}
          isOwner={isOwner}
          myRoles={myRoles}
          onClose={() => {
            closeModal();
            onPermissionsChanged();
          }}
        />
      ) : null}

      {openModal === "bans" && canBanMembers ? (
        <BansModal
          key={bansVersion}
          serverId={server.id}
          ownerId={server.owner_id}
          currentUserId={user ? String(user.id) : null}
          onOpenProfile={onOpenMemberProfile}
          onBanMember={onBanMember}
          onClose={closeModal}
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
