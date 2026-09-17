"use client";

import { Headphones, LogOut, Mic, Settings } from "lucide-react";
import { useState } from "react";

import { ActivityStatusDot } from "@/components/profile/activity-status-dot";
import { LogoutConfirmModal } from "@/components/profile/logout-confirm-modal";
import { ServerAvatar } from "@/components/ui/server-avatar";
import type { User } from "@/types/auth.types";

interface UserPanelProps {
  user: User;
  onClick: () => void;
}

/**
 * Barra fija al pie de la lista de canales: avatar + nombre propios, con
 * acceso directo al perfil (CA1). El icono de edicion vive dentro del modal
 * de perfil (`OwnProfileModal`), no aca.
 *
 * Mic/headphones/settings son decorativos (igual que en el prototipo Figma):
 * todavia no hay voz ni tema claro implementados en la app.
 */
export function UserPanel({ user, onClick }: UserPanelProps) {
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  return (
    <>
      <div
        className="flex w-full shrink-0 items-center gap-1 px-2 py-2"
        style={{
          background: "var(--bg-user-panel)",
          borderTop: "1px solid var(--border)",
        }}
      >
        <button
          type="button"
          onClick={onClick}
          className="hover:bg-surface-hover flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-md py-1 pl-1 text-left transition-colors"
        >
          <div className="relative shrink-0">
            <ServerAvatar
              name={user.name}
              src={user.avatar_url ? "/api/profile/avatar" : null}
              size={32}
              className="rounded-full"
            />
            {/* Estado de actividad mock: no hay presencia real en identify-service. */}
            <ActivityStatusDot
              status="online"
              size={11}
              ringColor="var(--bg-user-panel)"
              className="absolute right-0 bottom-0"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-content truncate text-sm leading-tight font-semibold">
              {user.name}
            </div>
            <div className="text-content-subtle truncate text-[11px]">
              Ver mi perfil
            </div>
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            title="Silenciar micrófono"
            className="text-content-muted hover:bg-surface-hover flex size-7 cursor-pointer items-center justify-center rounded-md transition-colors"
          >
            <Mic size={15} />
          </button>
          <button
            type="button"
            title="Silenciar audio"
            className="text-content-muted hover:bg-surface-hover flex size-7 cursor-pointer items-center justify-center rounded-md transition-colors"
          >
            <Headphones size={15} />
          </button>
          <button
            type="button"
            title="Ajustes"
            className="text-content-muted hover:bg-surface-hover flex size-7 cursor-pointer items-center justify-center rounded-md transition-colors"
          >
            <Settings size={15} />
          </button>
          <button
            type="button"
            title="Cerrar sesión"
            onClick={() => setIsLogoutModalOpen(true)}
            className="text-content-muted hover:bg-danger/10 hover:text-danger flex size-7 cursor-pointer items-center justify-center rounded-md transition-colors"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>

      {isLogoutModalOpen ? (
        <LogoutConfirmModal onClose={() => setIsLogoutModalOpen(false)} />
      ) : null}
    </>
  );
}
