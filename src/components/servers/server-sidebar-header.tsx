"use client";

import {
  ArrowLeftRight,
  ChevronDown,
  FolderPlus,
  LogOut,
  Plus,
  Shield,
  UserPlus,
} from "lucide-react";
import { useEffect, useState } from "react";

import { InviteModal } from "@/components/invites/invite-modal";
import { RolesModal } from "@/components/roles/roles-modal";
import { ServerAvatar } from "@/components/ui/server-avatar";
import { useAuth } from "@/services/auth/auth-context";
import { getPendingTransferRequest } from "@/services/ownership-transfers/client";
import type { OwnershipTransfer } from "@/types/ownership-transfer.types";

import { LeaveServerModal } from "./leave-server-modal";
import { TransferOwnershipModal } from "./transfer-ownership-modal";
import type { ServerSummary } from "@/types/server.types";
import { cn } from "@/lib/cn";

interface ServerSidebarHeaderProps {
  server: ServerSummary;
  onLeft: () => void;
  onCreateChannel: () => void;
  onCreateCategory: () => void;
  /** Se dispara cuando YO acepto una transferencia: paso a ser el nuevo owner. */
  onOwnershipAccepted: () => void;
}

/**
 * Header del panel de canales: nombre + menu desplegable. El menu tiene
 * "Invitar miembros" (cualquier miembro puede, no solo el owner -- ver
 * `services/servers/service.ts`), "Crear canal"/"Crear categoría" y
 * "Gestionar roles" (esas si son owner-only: `RequireManageChannels` /
 * `RequireManageRoles` del back hoy son literalmente "es el owner"),
 * "Transferir propiedad" (owner-only para iniciar; el destinatario de una
 * transferencia pendiente ve en su lugar "Responder transferencia de
 * propiedad" -- ver `TransferOwnershipModal`) y "Abandonar servidor". No
 * agregamos notificaciones/buscar/configuracion porque no existen todavia
 * del lado del back.
 */
export function ServerSidebarHeader({
  server,
  onLeft,
  onCreateChannel,
  onCreateCategory,
  onOwnershipAccepted,
}: ServerSidebarHeaderProps) {
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isRolesModalOpen, setIsRolesModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
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
  const showTransferMenuItem =
    isOwner || (!isLoadingPendingTransfer && incomingTransfer !== null);

  return (
    <div className="border-line relative shrink-0 border-b">
      <button
        type="button"
        onClick={() => setIsMenuOpen((prev) => !prev)}
        className="hover:bg-surface-hover flex h-12 w-full cursor-pointer items-center gap-2 px-4 transition-colors"
      >
        <ServerAvatar
          name={server.name}
          src={`/api/servers/${server.id}/icon`}
          size={24}
          className="rounded-full"
        />
        <span className="font-display text-content min-w-0 flex-1 truncate text-left text-sm font-semibold">
          {server.name}
        </span>
        <ChevronDown
          size={16}
          className={cn(
            "text-content-subtle shrink-0 transition-transform",
            isMenuOpen && "rotate-180",
          )}
        />
      </button>

      {isMenuOpen ? (
        <>
          <button
            type="button"
            aria-label="Cerrar menu"
            onClick={() => setIsMenuOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div className="bg-surface-raised border-line absolute top-full right-2 left-2 z-50 overflow-hidden rounded-xl border shadow-2xl">
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                setIsInviteModalOpen(true);
              }}
              className="text-content hover:bg-surface-hover flex w-full cursor-pointer items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors"
            >
              <UserPlus size={14} />
              Invitar miembros
            </button>
            {isOwner ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onCreateChannel();
                  }}
                  className="text-content hover:bg-surface-hover flex w-full cursor-pointer items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors"
                >
                  <Plus size={14} />
                  Crear canal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onCreateCategory();
                  }}
                  className="text-content hover:bg-surface-hover flex w-full cursor-pointer items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors"
                >
                  <FolderPlus size={14} />
                  Crear categoría
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsRolesModalOpen(true);
                  }}
                  className="text-content hover:bg-surface-hover flex w-full cursor-pointer items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors"
                >
                  <Shield size={14} />
                  Gestionar roles
                </button>
              </>
            ) : null}
            {showTransferMenuItem ? (
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsTransferModalOpen(true);
                }}
                className="text-content hover:bg-surface-hover flex w-full cursor-pointer items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors"
              >
                <ArrowLeftRight size={14} />
                {incomingTransfer
                  ? "Responder transferencia de propiedad"
                  : "Transferir propiedad"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                setIsLeaveModalOpen(true);
              }}
              className="text-danger hover:bg-danger/10 flex w-full cursor-pointer items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors"
            >
              <LogOut size={14} />
              Abandonar servidor
            </button>
          </div>
        </>
      ) : null}

      {isInviteModalOpen ? (
        <InviteModal
          serverId={server.id}
          serverName={server.name}
          onClose={() => setIsInviteModalOpen(false)}
        />
      ) : null}

      {isRolesModalOpen ? (
        <RolesModal
          serverId={server.id}
          serverName={server.name}
          onClose={() => setIsRolesModalOpen(false)}
        />
      ) : null}

      {isLeaveModalOpen ? (
        <LeaveServerModal
          serverId={server.id}
          serverName={server.name}
          isOwner={isOwner}
          onClose={() => setIsLeaveModalOpen(false)}
          onLeft={onLeft}
        />
      ) : null}

      {isTransferModalOpen ? (
        <TransferOwnershipModal
          serverId={server.id}
          serverName={server.name}
          isOwner={isOwner}
          currentUserId={user ? String(user.id) : null}
          pendingTransfer={pendingTransfer}
          isLoadingPendingTransfer={isLoadingPendingTransfer}
          onPendingTransferChange={setPendingTransfer}
          onClose={() => setIsTransferModalOpen(false)}
          onOwnershipAccepted={() => {
            setIsTransferModalOpen(false);
            onOwnershipAccepted();
          }}
        />
      ) : null}
    </div>
  );
}
