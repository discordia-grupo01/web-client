"use client";

import {
  isValidHex,
  MAX_NAME,
  ROLE_PERMISSIONS,
  roleMembersCount,
} from "@discordia/client-shared";
import {
  AlertCircle,
  Check,
  Star,
  Trash2,
} from "lucide-react";

import { cn } from "@/lib/cn";
import { type RolesEditor } from "../hooks/useRolesEditor";
import { RoleMembersPanel } from "../RoleMembersPanel";
import { ColorPicker, FieldError } from "../shared/ColorPicker";
import { PermissionToggle } from "../shared/PermissionToggle";

interface RoleEditFormProps {
  serverId: string;
  editor: RolesEditor;
}

export function RoleEditForm({ serverId, editor }: RoleEditFormProps) {
  const {
    selectedRole,
    selectedId,
    defaultRoleId,
    isEveryoneSelected,
    canManageSelected,
    selectedMemberCount,
    rightView,
    setRightView,
    // Edit form
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
    savedOk,
    handleDiscard,
    requestSave,
    // Set default
    settingDefault,
    handleSetDefault,
    // Delete
    deleteConfirm,
    setDeleteConfirm,
    deleteError,
    setDeleteError,
    deleting,
    handleDelete,
    // Members & toast
    handleMembershipChange,
    showToast,
  } = editor;

  if (!selectedRole) return null;

  return (
    <>
      <div className="flex-shrink-0 px-4 pt-5 pb-0 sm:px-7 sm:pt-6">
        <div className="mb-4 flex items-center gap-3">
          <span
            className="size-10 shrink-0 rounded-full"
            style={{ background: selectedRole.color, opacity: 0.9 }}
          />
          <div className="min-w-0 flex-1">
            <h3 className="text-content font-display truncate text-lg leading-tight font-bold">
              {selectedRole.name}
            </h3>
            <div className="mt-0.5 flex items-center gap-2">
              {selectedRole.id === defaultRoleId ? (
                <span className="text-highlight flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase">
                  <Star size={10} fill="currentColor" /> Rol por defecto
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
              className={cn(
                "-mb-px cursor-pointer px-4 py-2 text-xs font-semibold transition-all",
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

      {rightView === "edit" ? (
        <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5 sm:px-7">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-content-subtle text-xs font-bold tracking-wider uppercase">
                Nombre <span className="text-danger">*</span>
              </label>
              <span
                className={cn(
                  "font-mono text-xs",
                  editName.length > MAX_NAME
                    ? "text-danger"
                    : "text-content-subtle",
                )}
              >
                {editName.length}/{MAX_NAME}
              </span>
            </div>
            <div
              className={cn(
                "bg-surface-input flex items-center rounded-xl border px-4 py-3",
                nameError ? "border-danger" : "border-line",
              )}
            >
              <input
                type="text"
                value={editName}
                onChange={(event) => handleEditName(event.target.value)}
                maxLength={MAX_NAME + 10}
                disabled={isEveryoneSelected}
                readOnly={isEveryoneSelected}
                className={cn(
                  "text-content min-w-0 flex-1 border-none bg-transparent text-sm outline-none",
                  isEveryoneSelected && "cursor-not-allowed opacity-70",
                )}
              />
              {editName.trim() && isValidHex(editColor) ? (
                <div
                  className="ml-2 flex items-center gap-1 rounded-md px-2 py-0.5"
                  style={{
                    background: `${editColor}20`,
                    border: `1px solid ${editColor}40`,
                  }}
                >
                  <span
                    className="size-1.5 rounded-full"
                    style={{ background: editColor }}
                  />
                  <span
                    className="font-display text-[11px] font-semibold"
                    style={{ color: editColor }}
                  >
                    {editName.trim()}
                  </span>
                </div>
              ) : null}
            </div>
            <FieldError message={nameError} />
            {isEveryoneSelected ? (
              <p className="text-content-subtle mt-1.5 text-xs">
                @everyone es automático: lo tiene todo el mundo y no se puede
                renombrar.
              </p>
            ) : null}
          </div>

          <div>
            <label className="text-content-subtle mb-3 block text-xs font-bold tracking-wider uppercase">
              Color <span className="text-danger">*</span>
            </label>
            {isEveryoneSelected ? (
              <div className="bg-surface-input border-line flex items-center gap-3 rounded-xl border px-4 py-3">
                <span
                  className="border-line size-8 shrink-0 rounded-lg border"
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
                <ColorPicker
                  value={editColor}
                  onChange={handleEditColor}
                />
                <FieldError message={colorError} />
              </>
            )}
          </div>

          <div>
            <label className="text-content-subtle mb-3 block text-xs font-bold tracking-wider uppercase">
              Permisos
            </label>
            <div className="space-y-2">
              {ROLE_PERMISSIONS.map((perm) => (
                <PermissionToggle
                  key={perm}
                  perm={perm}
                  enabled={editPerms.includes(perm)}
                  disabled={!canManageSelected}
                  onChange={(on) => handleTogglePerm(perm, on)}
                />
              ))}
            </div>
            {!canManageSelected ? (
              <p className="text-content-subtle mt-2 text-xs">
                No tenés jerarquía suficiente para gestionar los permisos de
                este rol.
              </p>
            ) : null}
          </div>

          {!isEveryoneSelected && (
            <div className="border-danger/20 bg-danger/[0.06] space-y-3 rounded-xl border p-4">
              <p className="text-danger text-[10px] font-bold tracking-widest uppercase">
                Zona peligrosa
              </p>
              {!canManageSelected ? (
                <p className="text-content-subtle text-xs">
                  No tenés jerarquía suficiente para gestionar este rol.
                </p>
              ) : null}

              {selectedRole.id !== defaultRoleId ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-content text-sm font-semibold">
                      Definir como rol por defecto
                    </p>
                    <p className="text-content-subtle text-xs">
                      Se asigna automáticamente a los nuevos miembros.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSetDefault}
                    disabled={settingDefault || !canManageSelected}
                    className="text-highlight border-highlight/30 bg-highlight/10 ml-3 flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Star size={11} />
                    {settingDefault ? "Definiendo..." : "Definir"}
                  </button>
                </div>
              ) : (
                <div className="text-content-subtle flex items-center gap-2 text-xs">
                  <Star size={11} />
                  <span>
                    Este es el rol por defecto. Para eliminarlo, primero definí
                    otro rol como predeterminado.
                  </span>
                </div>
              )}

              {!deleteConfirm ? (
                <button
                  type="button"
                  onClick={() => {
                    setDeleteError("");
                    setDeleteConfirm(true);
                  }}
                  disabled={!canManageSelected}
                  className="text-danger border-danger/25 bg-danger/10 flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 size={12} /> Eliminar rol
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-danger font-display text-xs font-semibold">
                    ¿Confirmar eliminación de &quot;{selectedRole.name}&quot;?
                  </p>
                  {deleteError ? (
                    <div className="text-danger border-danger/20 bg-danger/10 flex items-start gap-2 rounded-lg border px-3 py-2 text-xs">
                      <AlertCircle size={13} />
                      <span>{deleteError}</span>
                    </div>
                  ) : null}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteConfirm(false);
                        setDeleteError("");
                      }}
                      className="bg-surface-input border-line text-content-muted flex-1 cursor-pointer rounded-lg border py-2 text-xs font-semibold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleting || !canManageSelected}
                      className="flex-1 cursor-pointer rounded-lg bg-gradient-to-br from-[#c0392b] to-[#922b21] py-2 text-xs font-semibold text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {deleting ? "Eliminando..." : "Eliminar"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {savedOk ? (
            <div className="border-success/30 bg-success/10 text-success flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm">
              <Check size={14} />
              <span>Cambios guardados.</span>
            </div>
          ) : null}
        </div>
      ) : (
        <RoleMembersPanel
          key={selectedRole.id}
          serverId={serverId}
          roleId={selectedRole.id}
          isEveryone={isEveryoneSelected}
          onMembershipChange={handleMembershipChange}
          onError={showToast}
        />
      )}

      {rightView === "edit" ? (
        <div className="border-line flex flex-shrink-0 items-center justify-end gap-3 border-t px-4 py-4 sm:px-7">
          <button
            type="button"
            onClick={handleDiscard}
            disabled={!isDirty}
            className="bg-surface-input border-line text-content-muted cursor-pointer rounded-xl border px-5 py-2.5 text-sm font-semibold transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Descartar
          </button>
          <button
            type="button"
            onClick={requestSave}
            disabled={!isDirty || saving}
            className="from-accent-gradient-start to-accent-gradient-end text-on-accent flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-br px-6 py-2.5 text-sm font-semibold transition-all hover:brightness-110 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            style={{
              boxShadow: isDirty
                ? "0 6px 20px rgba(36,92,107,0.4)"
                : "none",
            }}
          >
            {saving ? (
              <>
                <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                <span>Guardando...</span>
              </>
            ) : (
              "Guardar cambios"
            )}
          </button>
        </div>
      ) : null}
    </>
  );
}
