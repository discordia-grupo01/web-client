"use client";

import {
  outranksRole,
  type Role,
  sortRolesByPosition,
} from "@discordia/client-shared";
import {
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import type { Dispatch, SetStateAction } from "react";

import { reorderRolesRequest } from "@/services/roles/client";

interface UseRoleReorderOptions {
  serverId: string;
  roles: Role[] | null;
  setRoles: Dispatch<SetStateAction<Role[] | null>>;
  isOwner: boolean;
  myRoles: Role[];
  showError: (message: string) => void;
}

export function useRoleReorder({
  serverId,
  roles,
  setRoles,
  isOwner,
  myRoles,
  showError,
}: UseRoleReorderOptions) {
  const dragSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const hierarchyCtx = { isOwner, roles: myRoles };
  const sortedRoles = sortRolesByPosition(roles ?? []);
  const draggableRoles = sortedRoles.filter((role) => !role.is_everyone);
  const everyoneRole = sortedRoles.find((role) => role.is_everyone);
  const protectedRoles = draggableRoles.filter(
    (role) => !outranksRole(hierarchyCtx, role.position),
  );
  const manageableRoles = draggableRoles.filter((role) =>
    outranksRole(hierarchyCtx, role.position),
  );

  async function handleRolesDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = manageableRoles.findIndex((role) => role.id === active.id);
    const newIndex = manageableRoles.findIndex((role) => role.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    showError("");

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
      showError(result.message);
      setRoles(previousRoles);
      return;
    }
    setRoles(result.roles);
  }

  return {
    protectedRoles,
    manageableRoles,
    everyoneRole,
    showRoleGripColumn: draggableRoles.length > 1,
    dragSensors,
    handleRolesDragEnd,
  };
}
