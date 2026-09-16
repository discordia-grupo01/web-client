"use client";

import { AlertCircle, Check, Users, X } from "lucide-react";
import { useEffect, useState } from "react";

import { ServerAvatar } from "@/components/ui/server-avatar";
import {
  assignRoleRequest,
  listMemberRolesRequest,
  listRolesRequest,
  removeRoleRequest,
} from "@/services/roles/client";
import type { Role } from "@/services/roles/types";
import { cn } from "@/lib/cn";

interface MemberRolesModalProps {
  serverId: string;
  userId: string;
  memberName: string;
  onClose: () => void;
}

/**
 * Checklist de todos los roles del server para asignarle/quitarle a un
 * miembro puntual. Los cambios se acumulan localmente y se aplican todos
 * juntos con "Guardar cambios" (diff contra lo que tenia al abrir). Owner-only
 * del lado del back.
 */
export function MemberRolesModal({
  serverId,
  userId,
  memberName,
  onClose,
}: MemberRolesModalProps) {
  const [roles, setRoles] = useState<Role[] | null>(null);
  const [initialRoleIds, setInitialRoleIds] = useState<string[]>([]);
  const [localRoleIds, setLocalRoleIds] = useState<string[]>([]);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      listRolesRequest(serverId),
      listMemberRolesRequest(serverId, userId),
    ]).then(([rolesResult, memberRolesResult]) => {
      if (cancelled) return;
      if (!rolesResult.ok) {
        setLoadError(rolesResult.message);
        setRoles([]);
        return;
      }
      setRoles(rolesResult.roles);
      const currentIds = memberRolesResult.ok
        ? memberRolesResult.roles.map((r) => r.id)
        : [];
      if (!memberRolesResult.ok) setLoadError(memberRolesResult.message);
      setInitialRoleIds(currentIds);
      setLocalRoleIds(currentIds);
    });
    return () => {
      cancelled = true;
    };
  }, [serverId, userId]);

  const hasChanges =
    JSON.stringify([...localRoleIds].sort()) !==
    JSON.stringify([...initialRoleIds].sort());

  function toggle(roleId: string) {
    setLocalRoleIds((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId],
    );
  }

  async function handleSave() {
    const toAdd = localRoleIds.filter((id) => !initialRoleIds.includes(id));
    const toRemove = initialRoleIds.filter((id) => !localRoleIds.includes(id));

    setIsSaving(true);
    setSaveError("");
    const results = await Promise.all([
      ...toAdd.map((roleId) => assignRoleRequest(serverId, userId, roleId)),
      ...toRemove.map((roleId) => removeRoleRequest(serverId, userId, roleId)),
    ]);
    setIsSaving(false);

    const failed = results.find((r) => !r.ok);
    if (failed && !failed.ok) {
      setSaveError(failed.message);
      return;
    }

    onClose();
  }

  const isLoading = roles === null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="border-line-strong relative flex w-full flex-col overflow-hidden rounded-[20px] border shadow-[0_32px_80px_rgba(0,0,0,0.55)]"
        style={{
          maxWidth: 420,
          maxHeight: "85dvh",
          background: "var(--bg-modal)",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="bg-surface-input text-content-subtle border-line absolute top-4 right-4 z-10 flex size-8 items-center justify-center rounded-full border transition-transform hover:scale-110"
        >
          <X size={13} />
        </button>

        <div className="flex-shrink-0 px-6 pt-7 pb-5">
          <div className="flex items-center gap-3">
            <ServerAvatar
              name={memberName}
              size={44}
              className="shrink-0 rounded-full"
            />
            <div>
              <h2 className="text-content font-display text-base font-bold">
                Roles de {memberName}
              </h2>
              <p className="text-content-subtle flex items-center gap-1 text-xs">
                <Users size={11} />
                {localRoleIds.length}{" "}
                {localRoleIds.length === 1 ? "rol asignado" : "roles asignados"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto px-6 pb-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <span className="border-line-strong border-t-accent size-6 animate-spin rounded-full border-2" />
            </div>
          ) : loadError ? (
            <p className="text-danger text-xs">{loadError}</p>
          ) : (roles ?? []).length === 0 ? (
            <p className="text-content-muted text-sm">
              Este servidor todavía no tiene roles creados.
            </p>
          ) : (
            (roles ?? []).map((role) => {
              const has = localRoleIds.includes(role.id);
              return (
                <div
                  key={role.id}
                  onClick={() => toggle(role.id)}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-all",
                    has ? "border-line" : "bg-surface-input border-line",
                  )}
                  style={
                    has
                      ? {
                          background: `${role.color}12`,
                          borderColor: `${role.color}40`,
                        }
                      : undefined
                  }
                >
                  <span
                    className="size-3 shrink-0 rounded-full"
                    style={{ background: role.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-content text-sm font-semibold">
                      {role.name}
                    </p>
                    <p className="text-content-subtle text-xs">
                      {role.permissions.length}{" "}
                      {role.permissions.length === 1 ? "permiso" : "permisos"}
                    </p>
                  </div>
                  <div
                    className="flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-all"
                    style={{
                      borderColor: has ? role.color : "var(--border-strong)",
                      background: has ? role.color : "transparent",
                    }}
                  >
                    {has ? <Check size={10} className="text-white" /> : null}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {saveError ? (
          <div className="border-danger/30 bg-danger/10 text-danger mx-6 mb-3 flex items-start gap-2 rounded-xl border px-3 py-2 text-xs">
            <AlertCircle size={13} className="mt-0.5 shrink-0" />
            <span>{saveError}</span>
          </div>
        ) : null}

        <div className="border-line flex flex-shrink-0 gap-3 border-t px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="bg-surface-input border-line text-content-muted flex-1 rounded-xl border py-2.5 text-sm font-semibold transition-all hover:brightness-110"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="from-accent flex-1 rounded-xl bg-gradient-to-br to-[#1a4050] py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.97] disabled:opacity-40 disabled:shadow-none"
            style={{
              boxShadow: hasChanges ? "0 6px 20px rgba(36,92,107,0.4)" : "none",
            }}
          >
            {isSaving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}
