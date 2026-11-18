"use client";

import {
  EVERYONE_VIEW_CHANNELS_OFF_BODY,
  EVERYONE_VIEW_CHANNELS_OFF_CONFIRM,
  EVERYONE_VIEW_CHANNELS_OFF_TITLE,
  type Role,
} from "@discordia/client-shared";
import { ChevronLeft, EyeOff, Shield, X } from "lucide-react";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { cn } from "@/lib/cn";

import { RoleCreateForm } from "./create/RoleCreateForm";
import { RoleEditForm } from "./edit/RoleEditForm";
import { useRolesEditor } from "./hooks/useRolesEditor";
import { RolesList } from "./list/RolesList";

export interface RolesPanelProps {
  serverId: string;
  serverName: string;
  isOwner: boolean;
  myRoles: Role[];
  onClose?: () => void;
  titleId?: string;
}

export function RolesPanel({
  serverId,
  isOwner,
  myRoles,
  onClose,
}: RolesPanelProps) {
  const editor = useRolesEditor({ serverId, isOwner, myRoles });

  const {
    rightView,
    mobileView,
    setMobileView,
    selectedRole,
    toast,
    isConfirmingEveryoneView,
    setIsConfirmingEveryoneView,
    handleSave,
  } = editor;

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 overflow-hidden">
      {/* Columna izquierda: lista de roles */}
      <RolesList editor={editor} onClose={onClose} />

      {/* Columna derecha: detalle (edición / creación / miembros) */}
      <div
        className={cn(
          "min-w-0 flex-1 flex-col overflow-hidden sm:flex",
          mobileView === "detail" ? "flex" : "hidden",
        )}
      >
        {/* Cabecera móvil con botón para volver a la lista */}
        <div className="border-line flex shrink-0 items-center justify-between border-b px-2 py-2 sm:hidden">
          <button
            type="button"
            onClick={() => setMobileView("list")}
            className="text-content-muted hover:text-content flex cursor-pointer items-center gap-1 rounded-xl px-2 py-1.5 text-sm font-semibold"
          >
            <ChevronLeft size={18} />
            Roles
          </button>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="text-content-subtle hover:text-content flex size-8 cursor-pointer items-center justify-center rounded-xl"
            >
              <X size={16} />
            </button>
          ) : null}
        </div>

        {rightView === "create" ? (
          <RoleCreateForm editor={editor} />
        ) : selectedRole ? (
          <RoleEditForm serverId={serverId} editor={editor} />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
            <Shield size={36} className="text-content-subtle" />
            <p className="text-content-subtle text-sm">
              Seleccioná un rol de la lista para editarlo.
            </p>
          </div>
        )}
      </div>

      {/* Toast flotante */}
      <div
        className="bg-surface-raised border-line-strong pointer-events-none absolute left-1/2 flex min-w-[200px] -translate-x-1/2 items-center gap-2.5 rounded-xl border px-4 py-2.5 shadow-xl transition-all duration-300"
        style={{
          bottom: toast ? 20 : -60,
          opacity: toast ? 1 : 0,
          zIndex: 999,
        }}
      >
        <span className="bg-accent size-2 shrink-0 rounded-full" />
        <p className="text-content font-display text-sm font-semibold">
          {toast}
        </p>
      </div>

      {/* Diálogo de confirmación para revocar permisos de @everyone */}
      {isConfirmingEveryoneView ? (
        <ConfirmDialog
          icon={EyeOff}
          title={EVERYONE_VIEW_CHANNELS_OFF_TITLE}
          body={EVERYONE_VIEW_CHANNELS_OFF_BODY}
          confirmLabel={EVERYONE_VIEW_CHANNELS_OFF_CONFIRM}
          onConfirm={() => void handleSave()}
          onCancel={() => setIsConfirmingEveryoneView(false)}
        />
      ) : null}
    </div>
  );
}
