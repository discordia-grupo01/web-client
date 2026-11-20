"use client";

import { outranksRole, type Role } from "@discordia/client-shared";
import { useEffect, useState } from "react";

import {
  listRolesRequest,
  setDefaultRoleRequest,
} from "@/services/roles/client";
import { useToast } from "@/hooks/useToast";

import { useRoleCreateForm } from "./useRoleCreateForm";
import { useRoleDelete } from "./useRoleDelete";
import { useRoleEditForm } from "./useRoleEditForm";
import { useRoleMemberCounts } from "./useRoleMemberCounts";
import { useRoleReorder } from "./useRoleReorder";

export type RightView = "edit" | "members" | "create";
export type RolesView = "list" | "detail";

interface UseRolesEditorOptions {
  serverId: string;
  isOwner: boolean;
  myRoles: Role[];
}

export function useRolesEditor({
  serverId,
  isOwner,
  myRoles,
}: UseRolesEditorOptions) {
  const [roles, setRoles] = useState<Role[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [rightView, setRightView] = useState<RightView>("edit");
  const [view, setView] = useState<RolesView>("list");
  const [defaultRoleId, setDefaultRoleId] = useState<string | null>(null);
  const [settingDefault, setSettingDefault] = useState(false);
  const [error, setError] = useState("");
  const { toast, showToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    listRolesRequest(serverId).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setLoadError(result.message);
        setRoles([]);
        return;
      }
      setRoles(result.roles);
    });
    return () => {
      cancelled = true;
    };
  }, [serverId]);

  const selectedRole = (roles ?? []).find((role) => role.id === selectedId);
  const canManageSelected = selectedRole
    ? outranksRole({ isOwner, roles: myRoles }, selectedRole.position)
    : false;

  const memberCounts = useRoleMemberCounts(roles, selectedId);
  const reorder = useRoleReorder({
    serverId,
    roles,
    setRoles,
    isOwner,
    myRoles,
    showError: setError,
  });
  const editForm = useRoleEditForm({
    roles,
    setRoles,
    selectedRole,
    canManageSelected,
    showToast,
    showError: setError,
  });
  const { setNewPerms, ...createForm } = useRoleCreateForm({
    serverId,
    roles,
    setRoles,
    showToast,
    showError: setError,
    onCreated: (role) => {
      setSelectedId(role.id);
      setRightView("edit");
    },
  });
  const deletion = useRoleDelete({
    setRoles,
    selectedRole,
    canManageSelected,
    showToast,
    showError: setError,
    onDeleted: () => {
      setSelectedId("");
      setView("list");
    },
  });

  function selectRole(id: string) {
    setError("");
    setSelectedId(id);
    setRightView("edit");
    setView("detail");
  }

  function backToList() {
    setError("");
    setView("list");
    setRightView("edit");
  }

  function openCreateForm() {
    setNewPerms(
      reorder.everyoneRole ? [...reorder.everyoneRole.permissions] : [],
    );
    setError("");
    setRightView("create");
    setView("detail");
  }

  async function handleSetDefault() {
    if (!selectedRole || !canManageSelected) return;
    setError("");
    setSettingDefault(true);
    const result = await setDefaultRoleRequest(serverId, selectedRole.id);
    setSettingDefault(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setDefaultRoleId(selectedRole.id);
    showToast(`"${selectedRole.name}" es ahora el rol por defecto`);
  }

  return {
    roles,
    isLoading: roles === null,
    loadError,
    selectedId,
    selectedRole,
    isEveryoneSelected: selectedRole?.is_everyone ?? false,
    canManageSelected,
    rightView,
    setRightView,
    view,
    selectRole,
    backToList,
    openCreateForm,
    defaultRoleId,
    settingDefault,
    handleSetDefault,
    toast,
    error,
    showError: setError,
    ...memberCounts,
    ...reorder,
    ...editForm,
    ...createForm,
    ...deletion,
  };
}

export type RolesEditor = ReturnType<typeof useRolesEditor>;
