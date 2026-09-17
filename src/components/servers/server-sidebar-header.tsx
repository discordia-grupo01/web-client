"use client";

import {
  ChevronDown,
  FolderPlus,
  LogOut,
  Plus,
  Shield,
  UserPlus,
} from "lucide-react";
import { useRef, useState } from "react";

import { InviteModal } from "@/components/invites/invite-modal";
import { RolesModal } from "@/components/roles/roles-modal";
import { Dropdown } from "@/components/ui/dropdown";
import { ServerAvatar } from "@/components/ui/server-avatar";
import { useAuth } from "@/services/auth/auth-context";

import { LeaveServerModal } from "./leave-server-modal";
import type { ServerSummary } from "@/types/server.types";
import { cn } from "@/lib/cn";

interface ServerSidebarHeaderProps {
  server: ServerSummary;
  onLeft: () => void;
  onCreateChannel: () => void;
  onCreateCategory: () => void;
}

/**
 * Header del panel de canales: nombre + menu desplegable. El menu tiene
 * "Invitar miembros" (cualquier miembro puede, no solo el owner -- ver
 * `services/servers/service.ts`), "Crear canal"/"Crear categoría" y
 * "Gestionar roles" (esas si son owner-only: `RequireManageChannels` /
 * `RequireManageRoles` del back hoy son literalmente "es el owner") y
 * "Abandonar servidor". No agregamos notificaciones/buscar/configuracion
 * porque no existen todavia del lado del back.
 */
export function ServerSidebarHeader({
  server,
  onLeft,
  onCreateChannel,
  onCreateCategory,
}: ServerSidebarHeaderProps) {
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isRolesModalOpen, setIsRolesModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const isOwner = user !== null && String(user.id) === server.owner_id;

  return (
    <div className="border-line relative shrink-0 border-b">
      <button
        ref={menuButtonRef}
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

      <Dropdown
        anchorRef={menuButtonRef}
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        align="stretch"
      >
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
      </Dropdown>

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
