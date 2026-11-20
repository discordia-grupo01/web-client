"use client";

import {
  NO_ROLES_YET,
  type Role,
  roleMembersCount,
} from "@discordia/client-shared";
import { closestCenter, DndContext, type Modifier } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronRight, GripVertical, Star, Users } from "lucide-react";

import type { HTMLAttributes } from "react";

import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

import { type RolesEditor } from "../hooks/useRolesEditor";

const restrictToRolesListBounds: Modifier = ({
  containerNodeRect,
  draggingNodeRect,
  transform,
}) => {
  if (!draggingNodeRect || !containerNodeRect) {
    return transform;
  }

  const minY = containerNodeRect.top - draggingNodeRect.top;
  const maxY =
    containerNodeRect.top + containerNodeRect.height - draggingNodeRect.bottom;
  const minX = containerNodeRect.left - draggingNodeRect.left;
  const maxX =
    containerNodeRect.left + containerNodeRect.width - draggingNodeRect.right;

  return {
    ...transform,
    x: Math.min(Math.max(transform.x, minX), maxX),
    y: Math.min(Math.max(transform.y, minY), maxY),
  };
};

type DragHandleProps = HTMLAttributes<HTMLSpanElement> & {
  ref: (node: HTMLElement | null) => void;
};

function RoleGripHandle({
  roleName,
  handle,
}: {
  roleName: string;
  handle?: DragHandleProps;
}) {
  if (!handle) return <span className="size-6 shrink-0" aria-hidden />;
  return (
    <span
      {...handle}
      aria-label={`Mover ${roleName}`}
      className="text-content-subtle hover:text-content flex size-6 shrink-0 cursor-grab touch-none items-center justify-center rounded-md active:cursor-grabbing"
    >
      <GripVertical size={16} />
    </span>
  );
}

interface RoleRowProps {
  role: Role;
  memberCount: number | undefined;
  isDefault: boolean;
  /** Las filas sin agarre igual dejan su columna, para que los nombres queden alineados. */
  showGripColumn: boolean;
  onSelect: () => void;
}

function RoleRowContent({
  role,
  memberCount,
  isDefault,
  showGripColumn,
  onSelect,
  handle,
}: RoleRowProps & { handle?: DragHandleProps }) {
  return (
    <>
      {showGripColumn ? (
        <RoleGripHandle roleName={role.name} handle={handle} />
      ) : null}
      <button
        type="button"
        onClick={onSelect}
        className="hover:bg-surface-hover flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors"
      >
        <span
          className="size-3 shrink-0 rounded-full"
          style={{ background: role.color }}
        />
        <span className="text-content font-display min-w-0 flex-1 truncate text-sm font-semibold">
          {role.name}
        </span>
        {isDefault ? (
          <Star
            size={13}
            className="text-highlight shrink-0"
            fill="currentColor"
            aria-label="Rol por defecto"
          />
        ) : null}
        {role.is_everyone ? (
          <span className="text-content-subtle shrink-0 text-xs">
            Todos los miembros
          </span>
        ) : (
          <>
            <span className="text-content-subtle flex shrink-0 items-center gap-1 text-xs tabular-nums">
              <Users size={13} aria-hidden />
              <span className="sr-only">
                {memberCount !== undefined
                  ? roleMembersCount(memberCount)
                  : null}
              </span>
              <span aria-hidden>{memberCount ?? "–"}</span>
            </span>
            <span
              className="text-content-subtle w-7 shrink-0 text-right font-mono text-xs"
              title="Posición en la jerarquía"
            >
              #{role.position}
            </span>
          </>
        )}
        <ChevronRight size={16} className="text-content-subtle shrink-0" />
      </button>
    </>
  );
}

function SortableRoleRow(props: RoleRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.role.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className="border-line flex items-center gap-1 border-b last:border-b-0"
    >
      <RoleRowContent
        {...props}
        handle={{ ...attributes, ...listeners, ref: setActivatorNodeRef }}
      />
    </div>
  );
}

function StaticRoleRow(props: RoleRowProps) {
  return (
    <div className="border-line flex items-center gap-1 border-b last:border-b-0">
      <RoleRowContent {...props} />
    </div>
  );
}

interface RolesListProps {
  editor: RolesEditor;
}

export function RolesList({ editor }: RolesListProps) {
  const {
    roles,
    isLoading,
    loadError,
    defaultRoleId,
    protectedRoles,
    manageableRoles,
    everyoneRole,
    showRoleGripColumn,
    dragSensors,
    handleRolesDragEnd,
    selectRole,
    roleMemberCounts,
  } = editor;

  if (isLoading) return <LoadingSpinner />;
  if (loadError) return <p className="text-danger text-sm">{loadError}</p>;
  if ((roles ?? []).length === 0) {
    return <p className="text-content-muted text-sm">{NO_ROLES_YET}</p>;
  }

  function rowProps(role: Role): RoleRowProps {
    return {
      role,
      memberCount: roleMemberCounts[role.id],
      isDefault: role.id === defaultRoleId,
      showGripColumn: showRoleGripColumn,
      onSelect: () => selectRole(role.id),
    };
  }

  return (
    <div>
      <DndContext
        sensors={dragSensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToRolesListBounds]}
        onDragEnd={handleRolesDragEnd}
      >
        <div>
          {protectedRoles.map((role) => (
            <StaticRoleRow key={role.id} {...rowProps(role)} />
          ))}
          <SortableContext
            items={manageableRoles.map((role) => role.id)}
            strategy={verticalListSortingStrategy}
          >
            {manageableRoles.map((role) => (
              <SortableRoleRow key={role.id} {...rowProps(role)} />
            ))}
          </SortableContext>
        </div>
      </DndContext>
      {everyoneRole ? (
        <div className="border-line-strong mt-2 border-t pt-2">
          <StaticRoleRow {...rowProps(everyoneRole)} />
        </div>
      ) : null}
    </div>
  );
}
