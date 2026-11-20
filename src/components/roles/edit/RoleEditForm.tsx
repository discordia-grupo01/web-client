"use client";

import { roleMembersCount } from "@discordia/client-shared";
import { AlertCircle, Star, Trash2 } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/Button";
import { SaveBar } from "@/components/ui/settings/SaveBar";
import { SettingsGroup } from "@/components/ui/settings/SettingsGroup";
import { SettingsRow } from "@/components/ui/settings/SettingsRow";
import { SettingsHeading } from "@/components/ui/settings/SettingsHeading";
import { SettingsSection } from "@/components/ui/settings/SettingsSection";
import { Switch } from "@/components/ui/Switch";
import { cn } from "@/lib/cn";

import { type RolesEditor } from "../hooks/useRolesEditor";
import { RoleMembersPanel } from "../RoleMembersPanel";
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
    deleteConfirm,
    setDeleteConfirm,
    deleteError,
    setDeleteError,
    deleting,
    handleDelete,
    handleMembershipChange,
    showToast,
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
        </div>
        <RoleMembersPanel
          key={selectedRole.id}
          serverId={serverId}
          roleId={selectedRole.id}
          isEveryone={isEveryoneSelected}
          onMembershipChange={handleMembershipChange}
          onError={showToast}
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
        <RoleNameField
          inputId={NAME_INPUT_ID}
          value={editName}
          error={nameError}
          disabled={isEveryoneSelected}
          hint={
            isEveryoneSelected
              ? "@everyone es automático: lo tiene todo el mundo y no se puede renombrar."
              : undefined
          }
          onChange={handleEditName}
        />

        <SettingsGroup
          label={
            <>
              Color <span className="text-danger">*</span>
            </>
          }
        >
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
          <div>
            <SettingsRow
              label="Rol por defecto"
              hint={
                isDefault
                  ? "Se asigna automáticamente a los nuevos miembros. Para cambiarlo, definí otro rol como predeterminado."
                  : "Se asigna automáticamente a los nuevos miembros."
              }
              control={
                <Switch
                  checked={isDefault}
                  label="Rol por defecto"
                  disabled={isDefault || settingDefault || !canManageSelected}
                  onChange={(on) => {
                    if (on) void handleSetDefault();
                  }}
                />
              }
            />
          </div>
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
            {!canManageSelected ? (
              <p className="text-content-subtle text-xs">
                No tenés jerarquía suficiente para gestionar este rol.
              </p>
            ) : isDefault ? (
              <p className="text-content-subtle text-xs">
                Para eliminar este rol, primero definí otro rol como
                predeterminado.
              </p>
            ) : null}

            {!deleteConfirm ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setDeleteError("");
                  setDeleteConfirm(true);
                }}
                disabled={!canManageSelected}
                className="text-danger border-danger/25 bg-danger/10 w-auto px-3 py-2 text-xs"
              >
                <Trash2 size={13} /> Eliminar rol
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="text-danger font-display text-sm font-semibold">
                  ¿Confirmar eliminación de &quot;{selectedRole.name}&quot;?
                </p>
                {deleteError ? (
                  <div className="text-danger border-danger/20 bg-danger/10 flex items-start gap-2 rounded-lg border px-3 py-2 text-xs">
                    <AlertCircle size={13} />
                    <span>{deleteError}</span>
                  </div>
                ) : null}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setDeleteConfirm(false);
                      setDeleteError("");
                    }}
                    className="flex-1 py-2 text-xs"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    onClick={handleDelete}
                    disabled={!canManageSelected}
                    isLoading={deleting}
                    className="flex-1 py-2 text-xs"
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </SettingsSection>
  );
}
