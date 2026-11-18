"use client";

import {
  COLOR_PALETTE,
  outranksRole,
  removesViewChannelsFromEveryone,
  type Role,
  type RolePermission,
  sortRolesByPosition,
  validateRole,
} from "@discordia/client-shared";
import {
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useEffect, useRef, useState } from "react";

import {
  createRoleRequest,
  deleteRoleRequest,
  listRoleMembersRequest,
  listRolesRequest,
  reorderRolesRequest,
  setDefaultRoleRequest,
  updateRoleRequest,
} from "@/services/roles/client";

export type RightView = "edit" | "members" | "create";
export type MobileView = "list" | "detail";

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
  const [mobileView, setMobileView] = useState<MobileView>("list");
  const [defaultRoleId, setDefaultRoleId] = useState<string | null>(null);

  // Edit form
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [editPerms, setEditPerms] = useState<RolePermission[]>([]);
  const [nameError, setNameError] = useState("");
  const [colorError, setColorError] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);

  // Delete
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Set default
  const [settingDefault, setSettingDefault] = useState(false);

  // Create form
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(COLOR_PALETTE[0]);
  const [newPerms, setNewPerms] = useState<RolePermission[]>([]);
  const [newNameError, setNewNameError] = useState("");
  const [newColorError, setNewColorError] = useState("");
  const [creating, setCreating] = useState(false);

  // Contadores de miembros por rol
  const [roleMemberCounts, setRoleMemberCounts] = useState<
    Record<string, number>
  >({});

  // Toast
  const [toast, setToast] = useState<string | null>(null);
  const [isConfirmingEveryoneView, setIsConfirmingEveryoneView] =
    useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dragSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function showToast(message: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
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
      setSelectedId(result.roles[0]?.id ?? "");
    });
    return () => {
      cancelled = true;
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, [serverId]);

  const selectedRole = (roles ?? []).find((role) => role.id === selectedId);
  const isEveryoneSelected = selectedRole?.is_everyone ?? false;
  const hierarchyCtx = { isOwner, roles: myRoles };
  const canManageSelected = selectedRole
    ? outranksRole(hierarchyCtx, selectedRole.position)
    : false;

  useEffect(() => {
    if (!selectedRole) return;
    setEditName(selectedRole.name);
    setEditColor(selectedRole.color);
    setEditPerms([...selectedRole.permissions]);
    setNameError("");
    setColorError("");
    setIsDirty(false);
    setSavedOk(false);
    setDeleteConfirm(false);
    setDeleteError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  // Se pide al elegir un rol, así el contador del encabezado ya es el real.
  useEffect(() => {
    if (!selectedId || roleMemberCounts[selectedId] !== undefined) return;
    let cancelled = false;
    listRoleMembersRequest(selectedId, { limit: 1 }).then((result) => {
      if (cancelled || !result.ok) return;
      setRoleMemberCounts((prev) => ({ ...prev, [selectedId]: result.total }));
    });
    return () => {
      cancelled = true;
    };
  }, [selectedId, roleMemberCounts]);

  function selectRole(id: string) {
    setSelectedId(id);
    setRightView("edit");
    setMobileView("detail");
  }

  const selectedMemberCount = roleMemberCounts[selectedId];

  function handleMembershipChange(delta: 1 | -1) {
    setRoleMemberCounts((prev) =>
      prev[selectedId] === undefined
        ? prev
        : { ...prev, [selectedId]: prev[selectedId] + delta },
    );
  }

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

  function handleToggleNewPerm(perm: RolePermission, on: boolean) {
    setNewPerms((prev) =>
      on ? [...prev, perm] : prev.filter((p) => p !== perm),
    );
  }

  function openCreateForm() {
    setNewPerms(everyoneRole ? [...everyoneRole.permissions] : []);
    setRightView("create");
    setMobileView("detail");
  }

  function handleDiscard() {
    if (!selectedRole) return;
    setEditName(selectedRole.name);
    setEditColor(selectedRole.color);
    setEditPerms([...selectedRole.permissions]);
    setIsDirty(false);
    setNameError("");
    setColorError("");
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

  async function handleSave() {
    setIsConfirmingEveryoneView(false);
    setNameError("");
    setColorError("");

    if (isEveryoneSelected) {
      setSaving(true);
      const result = await updateRoleRequest(selectedId, {
        permissions: editPerms,
      });
      setSaving(false);

      if (!result.ok) {
        showToast(result.message);
        return;
      }

      setRoles(
        (prev) =>
          prev?.map((r) => (r.id === result.role.id ? result.role : r)) ?? null,
      );
      setIsDirty(false);
      setSavedOk(true);
      showToast(`Permisos de "${result.role.name}" actualizados`);
      setTimeout(() => setSavedOk(false), 2000);
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

    setRoles(
      (prev) =>
        prev?.map((r) => (r.id === result.role.id ? result.role : r)) ?? null,
    );
    setIsDirty(false);
    setSavedOk(true);
    showToast(`Rol "${trimmed}" actualizado`);
    setTimeout(() => setSavedOk(false), 2000);
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

  async function handleDelete() {
    if (!selectedRole || !canManageSelected) return;
    setDeleting(true);
    const result = await deleteRoleRequest(selectedRole.id);
    setDeleting(false);

    if (!result.ok) {
      setDeleteError(result.message);
      return;
    }

    const remaining = (roles ?? []).filter((r) => r.id !== selectedRole.id);
    setRoles(remaining);
    setSelectedId(remaining[0]?.id ?? "");
    setDeleteConfirm(false);
    setMobileView("list");
    showToast(`Rol "${selectedRole.name}" eliminado`);
  }

  async function handleCreate() {
    setNewNameError("");
    setNewColorError("");
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
      if (!result.fieldErrors) showToast(result.message);
      return;
    }

    let createdRole = result.role;
    let toastMessage = `Rol "${trimmed}" creado`;
    if (newPerms.length > 0) {
      const permsResult = await updateRoleRequest(createdRole.id, {
        permissions: newPerms,
      });
      if (permsResult.ok) {
        createdRole = permsResult.role;
      } else {
        toastMessage = `Rol "${trimmed}" creado, pero no se pudieron guardar los permisos: ${permsResult.message}`;
      }
    }

    setCreating(false);
    setRoles((prev) => [...(prev ?? []), createdRole]);
    setNewName("");
    setNewColor(COLOR_PALETTE[0]);
    setSelectedId(createdRole.id);
    setRightView("edit");
    showToast(toastMessage);
  }

  const sortedRoles = sortRolesByPosition(roles ?? []);
  const draggableRoles = sortedRoles.filter((role) => !role.is_everyone);
  const everyoneRole = sortedRoles.find((role) => role.is_everyone);
  const protectedRoles = draggableRoles.filter(
    (role) => !outranksRole(hierarchyCtx, role.position),
  );
  const manageableRoles = draggableRoles.filter((role) =>
    outranksRole(hierarchyCtx, role.position),
  );
  const showRoleGripColumn = draggableRoles.length > 1;

  async function handleRolesDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = manageableRoles.findIndex((role) => role.id === active.id);
    const newIndex = manageableRoles.findIndex((role) => role.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedManageable = arrayMove(manageableRoles, oldIndex, newIndex);
    const reordered = [...protectedRoles, ...reorderedManageable];
    const previousRoles = roles ?? [];
    const roleIds = reordered.map((role) => role.id);
    const nextPositionById = new Map(
      reordered.map((role, index) => [role.id, index + 1]),
    );

    setRoles(
      (prev) =>
        prev?.map((role) =>
          nextPositionById.has(role.id)
            ? { ...role, position: nextPositionById.get(role.id)! }
            : role,
        ) ?? null,
    );

    const result = await reorderRolesRequest(serverId, roleIds);
    if (!result.ok) {
      showToast(result.message);
      setRoles(previousRoles);
      return;
    }
    setRoles(result.roles);
  }

  return {
    roles,
    isLoading: roles === null,
    loadError,
    selectedId,
    selectedRole,
    isEveryoneSelected,
    canManageSelected,
    rightView,
    setRightView,
    mobileView,
    setMobileView,
    defaultRoleId,
    selectedMemberCount,
    // Edit state & handlers
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
    // Delete state & handlers
    deleteConfirm,
    setDeleteConfirm,
    deleteError,
    setDeleteError,
    deleting,
    handleDelete,
    // Set default
    settingDefault,
    handleSetDefault,
    // Create state & handlers
    newName,
    setNewName,
    newColor,
    setNewColor,
    newPerms,
    newNameError,
    setNewNameError,
    newColorError,
    setNewColorError,
    creating,
    handleToggleNewPerm,
    openCreateForm,
    handleCreate,
    // List & dnd
    protectedRoles,
    manageableRoles,
    everyoneRole,
    showRoleGripColumn,
    dragSensors,
    handleRolesDragEnd,
    selectRole,
    handleMembershipChange,
    // Dialogs & toasts
    toast,
    showToast,
    isConfirmingEveryoneView,
    setIsConfirmingEveryoneView,
  };
}

export type RolesEditor = ReturnType<typeof useRolesEditor>;
