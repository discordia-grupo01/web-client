"use client";

import {
  ArrowLeftRight,
  FolderPlus,
  LogOut,
  Plus,
  Settings,
  Shield,
  UserPlus,
} from "lucide-react";

import { ServerMenuItem } from "./server-menu-item";

interface ServerMenuProps {
  isOwner: boolean;
  /** El owner lo inicia; el destinatario de una pendiente lo responde. */
  transferLabel: string | null;
  onClose: () => void;
  onInvite: () => void;
  onOpenSettings: () => void;
  onCreateChannel: () => void;
  onCreateCategory: () => void;
  onManageRoles: () => void;
  onTransfer: () => void;
  onLeave: () => void;
}

/**
 * Menu desplegable del servidor. Las opciones de administracion son
 * owner-only porque hoy el backend no tiene permisos mas finos:
 * `RequireManageChannels`, `RequireManageRoles` y `RequireManageServer` son
 * los tres literalmente "es el owner" (ver `servers/internal/service/authz.go`).
 * Cuando el backend tenga permisos por rol, este es el unico lugar que hay que
 * cambiar del lado de la UI.
 *
 * No hay notificaciones ni buscador: no existen todavia del lado del back.
 */
export function ServerMenu({
  isOwner,
  transferLabel,
  onClose,
  onInvite,
  onOpenSettings,
  onCreateChannel,
  onCreateCategory,
  onManageRoles,
  onTransfer,
  onLeave,
}: ServerMenuProps) {
  /** Cada opcion cierra el menu antes de hacer lo suyo. */
  function run(action: () => void) {
    return () => {
      onClose();
      action();
    };
  }

  return (
    <>
      <button
        type="button"
        aria-label="Cerrar menu"
        onClick={onClose}
        className="fixed inset-0 z-40 cursor-default"
      />
      <div className="bg-surface-raised border-line absolute top-full right-2 left-2 z-50 overflow-hidden rounded-xl border shadow-2xl">
        <ServerMenuItem
          icon={UserPlus}
          label="Invitar miembros"
          onClick={run(onInvite)}
        />

        {isOwner ? (
          <>
            <ServerMenuItem
              icon={Settings}
              label="Configuración del servidor"
              onClick={run(onOpenSettings)}
            />
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
            <ServerMenuItem
              icon={Shield}
              label="Gestionar roles"
              onClick={run(onManageRoles)}
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
