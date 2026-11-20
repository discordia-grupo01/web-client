"use client";

import type { Role } from "@discordia/client-shared";
import { type Dispatch, type SetStateAction, useEffect, useState } from "react";

import { deleteRoleRequest } from "@/services/roles/client";

interface UseRoleDeleteOptions {
  setRoles: Dispatch<SetStateAction<Role[] | null>>;
  selectedRole: Role | undefined;
  canManageSelected: boolean;
  onDeleted: () => void;
  showToast: (message: string) => void;
}

export function useRoleDelete({
  setRoles,
  selectedRole,
  canManageSelected,
  onDeleted,
  showToast,
}: UseRoleDeleteOptions) {
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const selectedId = selectedRole?.id;
  useEffect(() => {
    setDeleteConfirm(false);
    setDeleteError("");
  }, [selectedId]);

  async function handleDelete() {
    if (!selectedRole || !canManageSelected) return;
    setDeleting(true);
    const result = await deleteRoleRequest(selectedRole.id);
    setDeleting(false);

    if (!result.ok) {
      setDeleteError(result.message);
      return;
    }

    setRoles((prev) => prev?.filter((r) => r.id !== selectedRole.id) ?? []);
    setDeleteConfirm(false);
    onDeleted();
    showToast(`Rol "${selectedRole.name}" eliminado`);
  }

  return {
    deleteConfirm,
    setDeleteConfirm,
    deleteError,
    setDeleteError,
    deleting,
    handleDelete,
  };
}
