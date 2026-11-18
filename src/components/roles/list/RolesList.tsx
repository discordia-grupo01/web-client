"use client";

import { NO_ROLES_YET, type Role } from "@discordia/client-shared";
import { closestCenter, DndContext, type Modifier } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronRight, GripVertical, Plus, Shield, Star } from "lucide-react";

import { cn } from "@/lib/cn";
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

function RoleGripHandle({ active }: { active: boolean }) {
  return (
    <span
      className="flex size-6 shrink-0 items-center justify-center"
      aria-hidden
    >
      <GripVertical
        size={14}
        className={active ? "text-content-subtle" : "text-content-subtle/35"}
      />
    </span>
  );
}

function RoleRowButton({
  role,
  isSelected,
  isDefault,
  onSelect,
}: {
  role: Role;
  isSelected: boolean;
  isDefault: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex flex-1 cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all",
        isSelected
          ? "border-accent-strong/30 bg-accent/20"
          : "hover:bg-surface-hover border-transparent",
      )}
    >
      <span
        className="size-3 shrink-0 rounded-full"
        style={{ background: role.color }}
      />
      <span className="text-content font-display min-w-0 flex-1 truncate text-sm font-medium">
        {role.name}
      </span>
      <span className="flex shrink-0 items-center gap-1.5">
        <span
          className="text-content-subtle font-mono text-[10px]"
          title="Posición en la jerarquía"
        >
          #{role.position}
        </span>
        {isDefault ? (
          <Star
            size={11}
            className="text-highlight"
            fill="currentColor"
            aria-label="Rol por defecto"
          />
        ) : null}
        {isSelected ? (
          <ChevronRight size={11} className="text-content" />
        ) : null}
      </span>
    </button>
  );
}

function SortableRoleRow({
  role,
  isSelected,
  isDefault,
  showGripColumn,
  onSelect,
}: {
  role: Role;
  isSelected: boolean;
  isDefault: boolean;
  showGripColumn: boolean;
  onSelect: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: role.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      {...listeners}
      {...attributes}
      className="mb-1 flex touch-none items-center gap-1"
    >
      {showGripColumn ? <RoleGripHandle active /> : null}
      <RoleRowButton
        role={role}
        isSelected={isSelected}
        isDefault={isDefault}
        onSelect={onSelect}
      />
    </div>
  );
}

function ProtectedRoleRow({
  role,
  isSelected,
  isDefault,
  showGripColumn,
  onSelect,
}: {
  role: Role;
  isSelected: boolean;
  isDefault: boolean;
  showGripColumn: boolean;
  onSelect: () => void;
}) {
  return (
    <div className="mb-1 flex items-center gap-1">
      {showGripColumn ? <RoleGripHandle active={false} /> : null}
      <RoleRowButton
        role={role}
        isSelected={isSelected}
        isDefault={isDefault}
        onSelect={onSelect}
      />
    </div>
  );
}

function EveryoneRoleRow({
  role,
  isSelected,
  onSelect,
}: {
  role: Role;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "mb-1 flex w-full cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all",
        isSelected
          ? "border-accent-strong/30 bg-accent/20"
          : "hover:bg-surface-hover border-transparent",
      )}
    >
      <span
        className="size-3 shrink-0 rounded-full"
        style={{ background: role.color }}
      />
      <span className="text-content font-display min-w-0 flex-1 truncate text-sm font-medium">
        {role.name}
      </span>
      {isSelected ? <ChevronRight size={11} className="text-content" /> : null}
    </button>
  );
}

interface RolesListProps {
  editor: RolesEditor;
  onClose?: () => void;
}

export function RolesList({ editor, onClose }: RolesListProps) {
  const {
    roles,
    isLoading,
    loadError,
    selectedId,
    rightView,
    mobileView,
    defaultRoleId,
    protectedRoles,
    manageableRoles,
    everyoneRole,
    showRoleGripColumn,
    dragSensors,
    handleRolesDragEnd,
    selectRole,
    openCreateForm,
  } = editor;

  return (
    <div
      className={cn(
        "bg-surface-sunken border-line w-full shrink-0 flex-col overflow-hidden sm:flex sm:w-[220px] sm:border-r",
        mobileView === "list" ? "flex" : "hidden",
      )}
    >
      <div className="border-line flex-shrink-0 border-b px-4 pt-5 pb-3">
        <div className="mb-3 flex items-center gap-2">
          <Shield size={16} className="text-content" />
          <h2 className="text-content font-display text-sm font-bold tracking-wider uppercase">
            Roles
          </h2>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="from-accent-gradient-start to-accent-gradient-end text-on-accent flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br py-2 text-xs font-semibold transition-all hover:brightness-110"
        >
          <Plus size={12} />
          Crear rol
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <span className="border-line-strong border-t-accent size-6 animate-spin rounded-full border-2" />
          </div>
        ) : loadError ? (
          <p className="text-danger px-2 text-xs">{loadError}</p>
        ) : (roles ?? []).length === 0 ? (
          <p className="text-content-muted px-2 py-2 text-xs">{NO_ROLES_YET}</p>
        ) : (
          <>
            <DndContext
              sensors={dragSensors}
              collisionDetection={closestCenter}
              modifiers={[restrictToRolesListBounds]}
              onDragEnd={handleRolesDragEnd}
            >
              {protectedRoles.map((role) => (
                <ProtectedRoleRow
                  key={role.id}
                  role={role}
                  isSelected={role.id === selectedId && rightView !== "create"}
                  isDefault={role.id === defaultRoleId}
                  showGripColumn={showRoleGripColumn}
                  onSelect={() => selectRole(role.id)}
                />
              ))}
              <SortableContext
                items={manageableRoles.map((role) => role.id)}
                strategy={verticalListSortingStrategy}
              >
                {manageableRoles.map((role) => (
                  <SortableRoleRow
                    key={role.id}
                    role={role}
                    isSelected={
                      role.id === selectedId && rightView !== "create"
                    }
                    isDefault={role.id === defaultRoleId}
                    showGripColumn={showRoleGripColumn}
                    onSelect={() => selectRole(role.id)}
                  />
                ))}
              </SortableContext>
            </DndContext>
            {everyoneRole ? (
              <EveryoneRoleRow
                role={everyoneRole}
                isSelected={
                  everyoneRole.id === selectedId && rightView !== "create"
                }
                onSelect={() => selectRole(everyoneRole.id)}
              />
            ) : null}
          </>
        )}
      </div>

      {onClose ? (
        <div className="border-line flex-shrink-0 border-t p-3">
          <button
            type="button"
            onClick={onClose}
            className="bg-surface-input border-line text-content-subtle w-full cursor-pointer rounded-xl border py-2 text-xs font-semibold transition-all hover:brightness-110"
          >
            Cerrar
          </button>
        </div>
      ) : null}
    </div>
  );
}
