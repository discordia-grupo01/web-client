"use client";

import {
  type OwnershipTransfer,
  type ServerSummary,
} from "@discordia/client-shared";
import { useEffect, useState } from "react";

import { InviteModal } from "@/components/invites/invite-modal";
import { RolesModal } from "@/components/roles/roles-modal";
import { LeaveServerModal } from "@/components/servers/leave-server-modal";
import { ServerSettingsModal } from "@/components/servers/settings/server-settings-modal";
import { TransferOwnershipModal } from "@/components/servers/transfer-ownership-modal";
import { useAuth } from "@/services/auth/auth-context";
import { getPendingTransferRequest } from "@/services/ownership-transfers/client";

import { ServerHeaderTrigger } from "./server-header-trigger";
import { ServerMenu } from "./server-menu";

/** Que modal esta abierto. Nunca hay dos a la vez. */
type OpenModal = null | "invite" | "settings" | "roles" | "leave" | "transfer";

interface ServerSidebarHeaderProps {
  server: ServerSummary;
  isBannerVisible: boolean;
  onLeft: () => void;
  onCreateChannel: () => void;
  onCreateCategory: () => void;
  onServerUpdated: (server: ServerSummary) => void;
  /** Se dispara cuando YO acepto una transferencia: paso a ser el nuevo owner. */
  onOwnershipAccepted: () => void;
}

/**
 * Header del panel de canales: banner (si hay) + nombre + menu desplegable.
 * Aca solo vive el estado (que menu/modal esta abierto y la transferencia
 * pendiente); como se ve el boton esta en `ServerHeaderTrigger` y las
 * opciones en `ServerMenu`.
 */
export function ServerSidebarHeader({
  server,
  isBannerVisible,
  onLeft,
  onCreateChannel,
  onCreateCategory,
  onServerUpdated,
  onOwnershipAccepted,
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
          isOwner={isOwner}
          transferLabel={transferLabel}
          onClose={() => setIsMenuOpen(false)}
          onInvite={() => setOpenModal("invite")}
          onOpenSettings={() => setOpenModal("settings")}
          onCreateChannel={onCreateChannel}
          onCreateCategory={onCreateCategory}
          onManageRoles={() => setOpenModal("roles")}
          onTransfer={() => setOpenModal("transfer")}
          onLeave={() => setOpenModal("leave")}
        />
      ) : null}

      {openModal === "invite" ? (
        <InviteModal
          serverId={server.id}
          serverName={server.name}
          onClose={closeModal}
        />
      ) : null}

      {openModal === "settings" ? (
        <ServerSettingsModal
          server={server}
          onClose={closeModal}
          onUpdated={(updated) => {
            closeModal();
            onServerUpdated(updated);
          }}
        />
      ) : null}

      {openModal === "roles" ? (
        <RolesModal
          serverId={server.id}
          serverName={server.name}
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
