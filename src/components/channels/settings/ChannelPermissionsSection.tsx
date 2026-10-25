"use client";

import {
  ADD_ROLE_OVERRIDE_LABEL,
  ALL_ROLES_HAVE_OVERRIDES,
  canAllowOverride,
  canEditRoleOverride,
  type Channel,
  CHANNEL_PERMISSIONS_ADMINS_NOTE,
  CHANNEL_PERMISSIONS_ROLES_LABEL,
  type HierarchyContext,
  type Role,
  ROLE_ABOVE_OWN_HINT,
  sortRolesByPosition,
} from "@discordia/client-shared";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { FormAlert } from "@/components/ui/FormAlert";
import { cn } from "@/lib/cn";
import type { ChannelOverridesState } from "@/hooks/useChannelOverrides";

import { RoleOverrideEditor } from "./RoleOverrideEditor";

interface ChannelPermissionsSectionProps {
  channelKind: Channel["kind"];
  overrides: ChannelOverridesState;
  /** Todos los roles del servidor, @everyone incluido. */
  serverRoles: readonly Role[];
  actor: HierarchyContext & { serverPermissions: readonly string[] };
}

export function ChannelPermissionsSection({
  channelKind,
  overrides,
  serverRoles,
  actor,
}: ChannelPermissionsSectionProps) {
  const everyone = serverRoles.find((role) => role.is_everyone) ?? null;
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const { draft } = overrides;

  const { listedRoles, addableRoles } = useMemo(() => {
    const ranked = sortRolesByPosition(
      serverRoles.filter((role) => !role.is_everyone),
    );
    const inDraft = (role: Role) => draft !== null && role.id in draft;
    return {
      listedRoles: [...(everyone ? [everyone] : []), ...ranked.filter(inDraft)],
      addableRoles: ranked.filter((role) => !inDraft(role)),
    };
  }, [serverRoles, everyone, draft]);

  const selectedRole =
    listedRoles.find((role) => role.id === selectedRoleId) ?? everyone;

  return (
    <section>
      <p className="text-content-subtle text-xs">
        {CHANNEL_PERMISSIONS_ADMINS_NOTE}
      </p>

      <div className="mt-4">
        {overrides.status === "error" ? (
          <div className="space-y-3">
            <FormAlert message={overrides.loadError ?? undefined} />
            <Button
              type="button"
              variant="secondary"
              onClick={overrides.retry}
              className="w-auto"
            >
              Reintentar
            </Button>
          </div>
        ) : overrides.status === "loading" || !draft || !selectedRole ? (
          <div
            role="status"
            aria-label="Cargando permisos"
            className="border-line flex min-h-[300px] items-center justify-center rounded-xl border"
          >
            <span className="border-line-strong border-t-accent size-6 animate-spin rounded-full border-2" />
          </div>
        ) : (
          <div className="border-line flex min-h-[300px] flex-col overflow-hidden rounded-xl border sm:flex-row">
            <RoleOverrideList
              roles={listedRoles}
              addableRoles={addableRoles}
              selectedRoleId={selectedRole.id}
              canEdit={(role) => canEditRoleOverride(actor, role)}
              onSelect={setSelectedRoleId}
              onAdd={(roleId) => {
                overrides.addRole(roleId);
                setSelectedRoleId(roleId);
              }}
            />
            <RoleOverrideEditor
              role={selectedRole}
              channelKind={channelKind}
              values={draft[selectedRole.id]}
              disabled={!canEditRoleOverride(actor, selectedRole)}
              canAllow={(permission) => canAllowOverride(actor, permission)}
              onChange={(permission, value) =>
                overrides.setValue(selectedRole.id, permission, value)
              }
              onClear={() => {
                overrides.clearRole(selectedRole.id);
                if (!selectedRole.is_everyone) setSelectedRoleId(null);
              }}
            />
          </div>
        )}
      </div>
    </section>
  );
}

interface RoleOverrideListProps {
  /** Roles con excepcion en el borrador, @everyone primero. */
  roles: readonly Role[];
  /** Roles que todavia no estan en la lista. */
  addableRoles: readonly Role[];
  selectedRoleId: string;
  canEdit: (role: Role) => boolean;
  onSelect: (roleId: string) => void;
  onAdd: (roleId: string) => void;
}

function RoleDot({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      className="size-2.5 shrink-0 rounded-full"
      style={{ background: color }}
    />
  );
}

function RoleOverrideList({
  roles,
  addableRoles,
  selectedRoleId,
  canEdit,
  onSelect,
  onAdd,
}: RoleOverrideListProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <aside className="border-line bg-surface-raised shrink-0 border-b p-3 sm:w-44 sm:border-r sm:border-b-0">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-content-subtle text-[11px] font-bold tracking-wide uppercase">
          {CHANNEL_PERMISSIONS_ROLES_LABEL}
        </span>
        <div
          className="relative"
          onKeyDown={(event) => {
            if (event.key !== "Escape" || !isMenuOpen) return;
            // Que el Escape cierre solo el menu y no toda la configuracion.
            event.preventDefault();
            setIsMenuOpen(false);
          }}
        >
          <button
            type="button"
            aria-label={ADD_ROLE_OVERRIDE_LABEL}
            title={ADD_ROLE_OVERRIDE_LABEL}
            aria-expanded={isMenuOpen}
            aria-haspopup="menu"
            onClick={() => setIsMenuOpen((open) => !open)}
            className="text-content-muted hover:bg-surface-hover hover:text-content flex size-6 cursor-pointer items-center justify-center rounded transition-colors"
          >
            <Plus size={14} />
          </button>

          {isMenuOpen ? (
            <>
              <button
                type="button"
                aria-label="Cerrar menu"
                tabIndex={-1}
                onClick={() => setIsMenuOpen(false)}
                className="fixed inset-0 z-10 cursor-default"
              />
              <div
                role="menu"
                className="bg-surface-modal border-line-strong absolute top-7 right-0 z-20 max-h-64 w-52 overflow-y-auto rounded-md border p-1 shadow-xl sm:right-auto sm:left-0"
              >
                {addableRoles.length === 0 ? (
                  <p className="text-content-subtle p-2 text-xs">
                    {ALL_ROLES_HAVE_OVERRIDES}
                  </p>
                ) : (
                  addableRoles.map((role) => {
                    const isEditable = canEdit(role);
                    return (
                      <button
                        key={role.id}
                        type="button"
                        role="menuitem"
                        disabled={!isEditable}
                        title={isEditable ? undefined : ROLE_ABOVE_OWN_HINT}
                        onClick={() => {
                          setIsMenuOpen(false);
                          onAdd(role.id);
                        }}
                        className="text-content-muted hover:bg-surface-hover flex w-full cursor-pointer items-center gap-2.5 rounded px-2.5 py-2 text-left text-sm disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent"
                      >
                        <RoleDot color={role.color} />
                        <span className="truncate">{role.name}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>

      <ul className="flex gap-1 overflow-x-auto sm:flex-col sm:gap-0.5 sm:overflow-visible">
        {roles.map((role) => {
          const isSelected = role.id === selectedRoleId;
          return (
            <li key={role.id} className="shrink-0">
              <button
                type="button"
                aria-current={isSelected ? "true" : undefined}
                onClick={() => onSelect(role.id)}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors",
                  isSelected
                    ? "bg-surface-hover text-content"
                    : "text-content-muted hover:bg-surface-hover/60",
                )}
              >
                <RoleDot color={role.color} />
                <span className="truncate">{role.name}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
