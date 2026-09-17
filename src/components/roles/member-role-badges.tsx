"use client";

import { Plus, X } from "lucide-react";
import { useEffect, useState } from "react";

import { SearchableSelect } from "@/components/ui/searchable-select";
import { SectionLabel } from "@/components/ui/section-label";
import {
  assignRoleRequest,
  listMemberRolesRequest,
  listRolesRequest,
  removeRoleRequest,
} from "@/services/roles/client";
import type { Role } from "@/types/role.types";

interface MemberRoleBadgesProps {
  serverId: string;
  userId: string;
  /** Solo el owner puede agregar/quitar roles (regla actual del backend). */
  canManage: boolean;
}

/**
 * Roles de un miembro, con pills removibles y alta inline cuando
 * `canManage` es true -- reemplaza al viejo flujo de "Gestionar roles" en un
 * modal aparte (icono de escudo en la lista de miembros): ahora se edita
 * directo desde el modal de perfil, como en el prototipo de Figma.
 */
export function MemberRoleBadges({
  serverId,
  userId,
  canManage,
}: MemberRoleBadgesProps) {
  const [assignedRoles, setAssignedRoles] = useState<Role[] | null>(null);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [error, setError] = useState("");
  const [pendingRoleId, setPendingRoleId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setAssignedRoles(null);
    setAvailableRoles([]);
    setError("");

    listMemberRolesRequest(serverId, userId).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setError(result.message);
        setAssignedRoles([]);
        return;
      }
      setAssignedRoles(result.roles);
    });

    if (canManage) {
      listRolesRequest(serverId).then((result) => {
        if (!cancelled && result.ok) setAvailableRoles(result.roles);
      });
    }

    return () => {
      cancelled = true;
    };
  }, [serverId, userId, canManage]);

  async function handleAdd(roleId: string) {
    setPendingRoleId(roleId);
    const result = await assignRoleRequest(serverId, userId, roleId);
    setPendingRoleId(null);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setError("");
    setAssignedRoles((prev) => [...(prev ?? []), result.role]);
  }

  async function handleRemove(role: Role) {
    setPendingRoleId(role.id);
    const result = await removeRoleRequest(serverId, userId, role.id);
    setPendingRoleId(null);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setError("");
    setAssignedRoles((prev) => (prev ?? []).filter((r) => r.id !== role.id));
  }

  if (assignedRoles === null) {
    return (
      <div>
        <SectionLabel>Roles</SectionLabel>
        <p className="text-content-subtle mt-1.5 text-xs">Cargando roles...</p>
      </div>
    );
  }

  const assignedIds = new Set(assignedRoles.map((role) => role.id));
  const addableRoles = availableRoles.filter(
    (role) => !assignedIds.has(role.id),
  );

  return (
    <div>
      <SectionLabel>Roles</SectionLabel>
      {error ? <p className="text-danger mt-1 text-xs">{error}</p> : null}
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        {assignedRoles.map((role) => (
          <span
            key={role.id}
            className="flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium"
            style={{
              background: `${role.color}18`,
              color: role.color,
              borderColor: `${role.color}40`,
            }}
          >
            <span
              className="size-1.5 shrink-0 rounded-full"
              style={{ background: role.color }}
            />
            {role.name}
            {canManage ? (
              <button
                type="button"
                onClick={() => handleRemove(role)}
                disabled={pendingRoleId === role.id}
                aria-label={`Quitar rol "${role.name}"`}
                title={`Quitar rol "${role.name}"`}
                className="ml-0.5 flex size-3.5 shrink-0 cursor-pointer items-center justify-center rounded-sm hover:bg-black/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={9} />
              </button>
            ) : null}
          </span>
        ))}

        {assignedRoles.length === 0 ? (
          <span className="text-content-subtle text-xs">
            Sin roles asignados
          </span>
        ) : null}

        {canManage ? (
          <SearchableSelect
            options={addableRoles.map((role) => ({
              id: role.id,
              label: role.name,
              color: role.color,
            }))}
            onSelect={handleAdd}
            triggerLabel="Añadir rol"
            triggerIcon={<Plus size={11} />}
            searchPlaceholder="Buscar rol..."
            emptyMessage="No hay más roles para añadir"
          />
        ) : null}
      </div>
    </div>
  );
}
