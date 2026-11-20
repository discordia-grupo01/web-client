"use client";

import type { Role } from "@discordia/client-shared";
import { type Dispatch, type SetStateAction, useState } from "react";

import { deleteRoleRequest } from "@/services/roles/client";

interface UseRoleDeleteOptions {
  setRoles: Dispatch<SetStateAction<Role[] | null>>;
  selectedRole: Role | undefined;
  canManageSelected: boolean;
  onDeleted: () => void;
  showToast: (message: string) => void;
  showError: (message: string) => void;
}

export function useRoleDelete({
  setRoles,
  selectedRole,
  canManageSelected,
  onDeleted,
  showToast,
  showError,
}: UseRoleDeleteOptions) {
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleteConfirmOpen(false);
    if (!selectedRole || !canManageSelected) return;
    showError("");
    setDeleting(true);
    const result = await deleteRoleRequest(selectedRole.id);
    setDeleting(false);

    if (!result.ok) {
      showError(result.message);
      return;
    }

    setRoles((prev) => prev?.filter((r) => r.id !== selectedRole.id) ?? []);
    onDeleted();
    showToast(`Rol "${selectedRole.name}" eliminado`);
  }

  return {
    isDeleteConfirmOpen,
    setIsDeleteConfirmOpen,
    deleting,
    handleDelete,
  };
}
