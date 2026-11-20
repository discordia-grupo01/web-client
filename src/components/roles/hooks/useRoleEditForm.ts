"use client";

import {
  removesViewChannelsFromEveryone,
  type Role,
  type RolePermission,
  validateRole,
} from "@discordia/client-shared";
import { type Dispatch, type SetStateAction, useEffect, useState } from "react";

import { updateRoleRequest } from "@/services/roles/client";

const SAVED_FEEDBACK_MS = 2000;

interface UseRoleEditFormOptions {
  roles: Role[] | null;
  setRoles: Dispatch<SetStateAction<Role[] | null>>;
  selectedRole: Role | undefined;
  canManageSelected: boolean;
  showToast: (message: string) => void;
}

export function useRoleEditForm({
  roles,
  setRoles,
  selectedRole,
  canManageSelected,
  showToast,
}: UseRoleEditFormOptions) {
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [editPerms, setEditPerms] = useState<RolePermission[]>([]);
  const [nameError, setNameError] = useState("");
  const [colorError, setColorError] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [isConfirmingEveryoneView, setIsConfirmingEveryoneView] =
    useState(false);

  const selectedId = selectedRole?.id ?? "";

  function resetFromRole(role: Role) {
    setEditName(role.name);
    setEditColor(role.color);
    setEditPerms([...role.permissions]);
    setNameError("");
    setColorError("");
    setIsDirty(false);
  }

  useEffect(() => {
    if (!selectedRole) return;
    resetFromRole(selectedRole);
    setSavedOk(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  function handleEditName(value: string) {
    setEditName(value);
    setNameError("");
    setIsDirty(true);
  }

  function handleEditColor(value: string) {
    setEditColor(value);
    setColorError("");
    setIsDirty(true);
  }

  function handleTogglePerm(perm: RolePermission, on: boolean) {
    if (!canManageSelected) return;
    setEditPerms((prev) =>
      on ? [...prev, perm] : prev.filter((p) => p !== perm),
    );
    setIsDirty(true);
  }

  function handleDiscard() {
    if (selectedRole) resetFromRole(selectedRole);
  }

  function requestSave() {
    if (
      selectedRole &&
      removesViewChannelsFromEveryone(selectedRole, editPerms)
    ) {
      setIsConfirmingEveryoneView(true);
      return;
    }
    void handleSave();
  }

  function applySaved(updated: Role, message: string) {
    setRoles(
      (prev) => prev?.map((r) => (r.id === updated.id ? updated : r)) ?? null,
    );
    setIsDirty(false);
    setSavedOk(true);
    showToast(message);
    setTimeout(() => setSavedOk(false), SAVED_FEEDBACK_MS);
  }

  async function handleSave() {
    setIsConfirmingEveryoneView(false);
    setNameError("");
    setColorError("");

    if (selectedRole?.is_everyone) {
      setSaving(true);
      const result = await updateRoleRequest(selectedId, {
        permissions: editPerms,
      });
      setSaving(false);
      if (!result.ok) {
        showToast(result.message);
        return;
      }
      applySaved(result.role, `Permisos de "${result.role.name}" actualizados`);
      return;
    }

    const trimmed = editName.trim();
    const errors = validateRole(
      { name: trimmed, color: editColor },
      { existingRoles: roles ?? [], currentRoleId: selectedId },
    );
    if (errors.name || errors.color) {
      setNameError(errors.name ?? "");
      setColorError(errors.color ?? "");
      return;
    }

    setSaving(true);
    const result = await updateRoleRequest(selectedId, {
      name: trimmed,
      color: editColor,
      permissions: editPerms,
    });
    setSaving(false);

    if (!result.ok) {
      if (result.fieldErrors?.name) setNameError(result.fieldErrors.name);
      if (result.fieldErrors?.color) setColorError(result.fieldErrors.color);
      if (result.fieldErrors?.permissions) {
        showToast(result.fieldErrors.permissions);
      }
      if (!result.fieldErrors) showToast(result.message);
      return;
    }

    applySaved(result.role, `Rol "${trimmed}" actualizado`);
  }

  return {
    editName,
    editColor,
    editPerms,
    nameError,
    colorError,
    isDirty,
    saving,
    savedOk,
    handleEditName,
    handleEditColor,
    handleTogglePerm,
    handleDiscard,
    requestSave,
    handleSave,
    isConfirmingEveryoneView,
    setIsConfirmingEveryoneView,
  };
}
