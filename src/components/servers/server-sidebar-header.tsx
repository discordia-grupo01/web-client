"use client";

import { ChevronDown, LogOut, Shield, UserPlus } from "lucide-react";
import { useState } from "react";

import { InviteModal } from "@/components/servers/invite-modal";
import { LeaveServerModal } from "@/components/servers/leave-server-modal";
import { RolesModal } from "@/components/servers/roles-modal";
import { ServerAvatar } from "@/components/servers/server-avatar";
import { useAuth } from "@/services/auth/auth-context";
import type { ServerSummary } from "@/services/servers/types";
import { cn } from "@/lib/cn";

interface ServerSidebarHeaderProps {
  server: ServerSummary;
  onLeft: () => void;
}

/**
 * Header del panel de canales: nombre + menu desplegable. El menu tiene
 * "Invitar miembros" (cualquier miembro puede, no solo el owner -- ver
 * `services/servers/service.ts`), "Gestionar roles" (esa si es owner-only:
 * `RequireManageRoles` del back hoy es literalmente "es el owner") y
 * "Abandonar servidor". No agregamos notificaciones/buscar/configuracion
 * porque no existen todavia del lado del back.
 */
export function ServerSidebarHeader({
  server,
  onLeft,
}: ServerSidebarHeaderProps) {
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isRolesModalOpen, setIsRolesModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const isOwner = user !== null && String(user.id) === server.owner_id;

  return (
    <div className="border-line relative shrink-0 border-b">
      <button
        type="button"
        onClick={() => setIsMenuOpen((prev) => !prev)}
        className="hover:bg-surface-hover flex h-12 w-full items-center gap-2 px-4 transition-colors"
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
              className="text-content hover:bg-surface-hover flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors"
            >
              <UserPlus size={14} />
              Invitar miembros
            </button>
            {isOwner ? (
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsRolesModalOpen(true);
                }}
                className="text-content hover:bg-surface-hover flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors"
              >
                <Shield size={14} />
                Gestionar roles
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                setIsLeaveModalOpen(true);
              }}
              className="text-danger hover:bg-danger/10 flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors"
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
    </div>
  );
}
