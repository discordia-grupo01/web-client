"use client";

import { roleMembersCount } from "@discordia/client-shared";
import { Star, Trash2 } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { FormAlert } from "@/components/ui/FormAlert";
import { SaveBar } from "@/components/ui/settings/SaveBar";
import { SettingsGroup } from "@/components/ui/settings/SettingsGroup";
import { SettingsHeading } from "@/components/ui/settings/SettingsHeading";
import { SettingsSection } from "@/components/ui/settings/SettingsSection";
import { cn } from "@/lib/cn";

import { type RolesEditor } from "../hooks/useRolesEditor";
import { RoleMembersPanel } from "../RoleMembersPanel";
import { DefaultRoleCard } from "./DefaultRoleCard";
import { ColorPicker, FieldError } from "../shared/ColorPicker";
import { PermissionGroups } from "../shared/PermissionGroups";
import { RoleNameField } from "../shared/RoleNameField";

const NAME_INPUT_ID = "role-edit-name";

interface RoleEditFormProps {
  serverId: string;
  editor: RolesEditor;
  backButton?: ReactNode;
}

export function RoleEditForm({
  serverId,
  editor,
  backButton,
}: RoleEditFormProps) {
  const {
    selectedRole,
    defaultRoleId,
    isEveryoneSelected,
    canManageSelected,
    selectedMemberCount,
    rightView,
    setRightView,
    editName,
    handleEditName,
    nameError,
    editColor,
    handleEditColor,
    colorError,
    editPerms,
    handleTogglePerm,
    isDirty,
    saving,
    handleDiscard,
    requestSave,
    settingDefault,
    handleSetDefault,
    isDeleteConfirmOpen,
    setIsDeleteConfirmOpen,
    deleting,
    handleDelete,
    handleMembershipChange,
    error,
    showError,
  } = editor;

  if (!selectedRole) return null;
  const isDefault = selectedRole.id === defaultRoleId;

  const header = (
    <div>
      {backButton}
      <div className="mb-4 flex items-center gap-3">
        <span
          className="size-10 shrink-0 rounded-full"
          style={{ background: selectedRole.color, opacity: 0.9 }}
        />
        <div className="min-w-0 flex-1">
          <p className="text-content font-display truncate text-lg leading-tight font-bold">
            {selectedRole.name}
          </p>
          <div className="mt-0.5 flex items-center gap-2">
            {isDefault ? (
              <span className="text-highlight flex items-center gap-1 text-xs font-semibold">
                <Star size={11} fill="currentColor" /> Rol por defecto
              </span>
            ) : null}
            <span className="text-content-subtle text-xs">
              {isEveryoneSelected
                ? "Todos los miembros"
                : selectedMemberCount !== undefined
                  ? roleMembersCount(selectedMemberCount)
                  : null}
            </span>
          </div>
        </div>
      </div>

      <div className="border-line flex gap-1 border-b">
        {(["edit", "members"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setRightView(tab)}
            aria-pressed={rightView === tab}
            className={cn(
              "-mb-px cursor-pointer px-4 py-2 text-sm font-semibold transition-all",
              rightView === tab
                ? "text-content border-accent border-b-2"
                : "text-content-subtle border-b-2 border-transparent",
            )}
          >
            {tab === "edit" ? "Editar rol" : "Miembros"}
          </button>
        ))}
      </div>
    </div>
  );

  if (rightView === "members") {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 space-y-5 px-4 pt-5 sm:px-8 sm:pt-6">
          <SettingsHeading />
          {header}
          <FormAlert message={error} />
        </div>
        <RoleMembersPanel
          key={selectedRole.id}
          serverId={serverId}
          roleId={selectedRole.id}
          isEveryone={isEveryoneSelected}
          onMembershipChange={handleMembershipChange}
          onError={showError}
        />
      </div>
    );
  }

  return (
    <SettingsSection
      toolbar={header}
      footer={
        isDirty ? (
          <SaveBar
            isSaving={saving}
            onDiscard={handleDiscard}
            onSave={requestSave}
          />
        ) : null
      }
    >
      <div className="space-y-8">
        <FormAlert message={error} />
        <RoleNameField
          inputId={NAME_INPUT_ID}
          value={editName}
          color={editColor}
          error={nameError}
          disabled={isEveryoneSelected}
          hint={
            isEveryoneSelected
              ? "@everyone es automático: lo tiene todo el mundo y no se puede renombrar."
              : undefined
          }
          onChange={handleEditName}
        />

        <SettingsGroup label={<FieldLabel required>Color</FieldLabel>}>
          {isEveryoneSelected ? (
            <div className="bg-surface-input border-line flex items-center gap-3 rounded-xl border px-4 py-3">
              <span
                className="border-line size-7 shrink-0 rounded-full border"
                style={{ background: selectedRole.color }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-content text-sm font-medium">
                  Color por defecto
                </p>
                <p className="text-content-subtle text-xs">
                  No se puede personalizar.
                </p>
              </div>
            </div>
          ) : (
            <>
              <ColorPicker value={editColor} onChange={handleEditColor} />
              <FieldError message={colorError} />
            </>
          )}
        </SettingsGroup>

        {isEveryoneSelected ? null : (
          <DefaultRoleCard
            isDefault={isDefault}
            disabled={settingDefault || !canManageSelected}
            onSetDefault={() => void handleSetDefault()}
          />
        )}

        <div className="space-y-2">
          <PermissionGroups
            enabled={editPerms}
            disabled={!canManageSelected}
            onToggle={handleTogglePerm}
          />
          {!canManageSelected ? (
            <p className="text-content-subtle text-xs">
              No tenés jerarquía suficiente para gestionar los permisos de este
              rol.
            </p>
          ) : null}
        </div>

        {isEveryoneSelected ? null : (
          <div className="border-danger/20 bg-danger/[0.06] space-y-3 rounded-xl border p-4">
            <p className="text-danger font-display text-sm font-semibold">
              Zona peligrosa
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <div className="min-w-0">
                <p className="text-content text-sm font-medium">Eliminar rol</p>
                <p className="text-content-subtle mt-0.5 text-xs leading-relaxed">
                  {!canManageSelected
                    ? "No tenés jerarquía suficiente para gestionar este rol."
                    : isDefault
                      ? "Para eliminar este rol, primero definí otro rol como predeterminado."
                      : "Se les quita a todos los miembros que lo tienen. No se puede deshacer."}
                </p>
              </div>
              <Button
                type="button"
                variant="danger"
                onClick={() => setIsDeleteConfirmOpen(true)}
                disabled={!canManageSelected || isDefault}
                isLoading={deleting}
                className="w-auto shrink-0 self-start px-4 py-2 sm:self-auto"
              >
                <Trash2 size={14} /> Eliminar rol
              </Button>
            </div>
          </div>
        )}
      </div>

      {isDeleteConfirmOpen ? (
        <ConfirmDialog
          icon={Trash2}
          title={`¿Eliminar el rol "${selectedRole.name}"?`}
          body="Esta acción no se puede deshacer."
          confirmLabel="Eliminar rol"
          onConfirm={() => void handleDelete()}
          onCancel={() => setIsDeleteConfirmOpen(false)}
        />
      ) : null}
    </SettingsSection>
  );
}
