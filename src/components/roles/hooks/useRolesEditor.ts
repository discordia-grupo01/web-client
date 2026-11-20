"use client";

import { outranksRole, type Role } from "@discordia/client-shared";
import { useEffect, useRef, useState } from "react";

import {
  listRolesRequest,
  setDefaultRoleRequest,
} from "@/services/roles/client";

import { useRoleCreateForm } from "./useRoleCreateForm";
import { useRoleDelete } from "./useRoleDelete";
import { useRoleEditForm } from "./useRoleEditForm";
import { useRoleMemberCounts } from "./useRoleMemberCounts";
import { useRoleReorder } from "./useRoleReorder";

export type RightView = "edit" | "members" | "create";
export type RolesView = "list" | "detail";

const TOAST_MS = 2800;

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
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(message: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), TOAST_MS);
  }

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
      if (toastTimer.current) clearTimeout(toastTimer.current);
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
    showToast,
  });
  const editForm = useRoleEditForm({
    roles,
    setRoles,
    selectedRole,
    canManageSelected,
    showToast,
  });
  const { setNewPerms, ...createForm } = useRoleCreateForm({
    serverId,
    roles,
    setRoles,
    showToast,
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
    onDeleted: () => {
      setSelectedId("");
      setView("list");
    },
  });

  function selectRole(id: string) {
    setSelectedId(id);
    setRightView("edit");
    setView("detail");
  }

  function backToList() {
    setView("list");
    setRightView("edit");
  }

  function openCreateForm() {
    setNewPerms(
      reorder.everyoneRole ? [...reorder.everyoneRole.permissions] : [],
    );
    setRightView("create");
    setView("detail");
  }

  async function handleSetDefault() {
    if (!selectedRole || !canManageSelected) return;
    setSettingDefault(true);
    const result = await setDefaultRoleRequest(serverId, selectedRole.id);
    setSettingDefault(false);
    if (!result.ok) {
      showToast(result.message);
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
    showToast,
    ...memberCounts,
    ...reorder,
    ...editForm,
    ...createForm,
    ...deletion,
  };
}

export type RolesEditor = ReturnType<typeof useRolesEditor>;
