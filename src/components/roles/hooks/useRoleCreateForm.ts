"use client";

import {
  COLOR_PALETTE,
  type Role,
  type RolePermission,
  validateRole,
} from "@discordia/client-shared";
import { type Dispatch, type SetStateAction, useState } from "react";

import { createRoleRequest, updateRoleRequest } from "@/services/roles/client";

interface UseRoleCreateFormOptions {
  serverId: string;
  roles: Role[] | null;
  setRoles: Dispatch<SetStateAction<Role[] | null>>;
  onCreated: (role: Role) => void;
  showToast: (message: string) => void;
  showError: (message: string) => void;
}

export function useRoleCreateForm({
  serverId,
  roles,
  setRoles,
  onCreated,
  showToast,
  showError,
}: UseRoleCreateFormOptions) {
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(COLOR_PALETTE[0]);
  const [newPerms, setNewPerms] = useState<RolePermission[]>([]);
  const [newNameError, setNewNameError] = useState("");
  const [newColorError, setNewColorError] = useState("");
  const [creating, setCreating] = useState(false);

  function handleToggleNewPerm(perm: RolePermission, on: boolean) {
    setNewPerms((prev) =>
      on ? [...prev, perm] : prev.filter((p) => p !== perm),
    );
  }

  async function handleCreate() {
    setNewNameError("");
    setNewColorError("");
    showError("");
    const trimmed = newName.trim();
    const errors = validateRole(
      { name: trimmed, color: newColor },
      { existingRoles: roles ?? [] },
    );
    if (errors.name || errors.color) {
      setNewNameError(errors.name ?? "");
      setNewColorError(errors.color ?? "");
      return;
    }

    setCreating(true);
    const result = await createRoleRequest(serverId, {
      name: trimmed,
      color: newColor,
    });

    if (!result.ok) {
      setCreating(false);
      if (result.fieldErrors?.name) setNewNameError(result.fieldErrors.name);
      if (result.fieldErrors?.color) setNewColorError(result.fieldErrors.color);
      if (!result.fieldErrors) showError(result.message);
      return;
    }

    // `createRoleRequest` solo manda nombre y color: los permisos van aparte.
    let createdRole = result.role;
    let permsError = "";
    if (newPerms.length > 0) {
      const permsResult = await updateRoleRequest(createdRole.id, {
        permissions: newPerms,
      });
      if (permsResult.ok) {
        createdRole = permsResult.role;
      } else {
        permsError = `Rol "${trimmed}" creado, pero no se pudieron guardar los permisos: ${permsResult.message}`;
      }
    }

    setCreating(false);
    setRoles((prev) => [...(prev ?? []), createdRole]);
    setNewName("");
    setNewColor(COLOR_PALETTE[0]);
    onCreated(createdRole);
    if (permsError) showError(permsError);
    else showToast(`Rol "${trimmed}" creado`);
  }

  return {
    newName,
    setNewName,
    newColor,
    setNewColor,
    newPerms,
    setNewPerms,
    newNameError,
    setNewNameError,
    newColorError,
    setNewColorError,
    creating,
    handleToggleNewPerm,
    handleCreate,
  };
}
