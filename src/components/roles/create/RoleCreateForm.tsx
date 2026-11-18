"use client";

import {
  isValidHex,
  MAX_NAME,
  ROLE_PERMISSIONS,
} from "@discordia/client-shared";

import { cn } from "@/lib/cn";
import { type RolesEditor } from "../hooks/useRolesEditor";
import { ColorPicker, FieldError } from "../shared/ColorPicker";
import { PermissionToggle } from "../shared/PermissionToggle";

interface RoleCreateFormProps {
  editor: RolesEditor;
}

export function RoleCreateForm({ editor }: RoleCreateFormProps) {
  const {
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
    handleCreate,
    setRightView,
    setMobileView,
  } = editor;

  return (
    <div className="flex h-full flex-col">
      <div className="border-line flex-shrink-0 border-b px-4 pt-5 pb-4 sm:px-7 sm:pt-7">
        <h3 className="text-content font-display text-lg font-bold">
          Crear rol
        </h3>
        <p className="text-content-subtle mt-0.5 text-xs">
          Arranca con los mismos permisos que @everyone. Podés ajustarlos antes
          de crear o después.
        </p>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-4 py-6 sm:px-7">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-content-subtle text-xs font-bold tracking-wider uppercase">
              Nombre <span className="text-danger">*</span>
            </label>
            <span
              className={cn(
                "font-mono text-xs",
                newName.length > MAX_NAME
                  ? "text-danger"
                  : "text-content-subtle",
              )}
            >
              {newName.length}/{MAX_NAME}
            </span>
          </div>
          <div
            className={cn(
              "bg-surface-input flex items-center rounded-xl border px-4 py-3",
              newNameError ? "border-danger" : "border-line",
            )}
          >
            <input
              type="text"
              value={newName}
              onChange={(event) => {
                setNewName(event.target.value);
                setNewNameError("");
              }}
              placeholder="Nombre del rol"
              autoFocus
              maxLength={MAX_NAME + 10}
              className="text-content min-w-0 flex-1 border-none bg-transparent text-sm outline-none"
            />
            {newName.trim() && isValidHex(newColor) ? (
              <div
                className="ml-2 flex items-center gap-1 rounded-md px-2 py-0.5"
                style={{
                  background: `${newColor}20`,
                  border: `1px solid ${newColor}40`,
                }}
              >
                <span
                  className="size-1.5 rounded-full"
                  style={{ background: newColor }}
                />
                <span
                  className="font-display text-[11px] font-semibold"
                  style={{ color: newColor }}
                >
                  {newName.trim()}
                </span>
              </div>
            ) : null}
          </div>
          <FieldError message={newNameError} />
        </div>

        <div>
          <label className="text-content-subtle mb-3 block text-xs font-bold tracking-wider uppercase">
            Color <span className="text-danger">*</span>
          </label>
          <ColorPicker
            value={newColor}
            onChange={(color) => {
              setNewColor(color);
              setNewColorError("");
            }}
          />
          <FieldError message={newColorError} />
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
                enabled={newPerms.includes(perm)}
                onChange={(on) => handleToggleNewPerm(perm, on)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="border-line flex flex-shrink-0 items-center justify-end gap-3 border-t px-4 py-4 sm:px-7">
        <button
          type="button"
          onClick={() => {
            setRightView("edit");
            setMobileView("list");
          }}
          className="bg-surface-input border-line text-content-muted cursor-pointer rounded-xl border px-5 py-2.5 text-sm font-semibold transition-all hover:brightness-110"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleCreate}
          disabled={creating}
          className="from-accent-gradient-start to-accent-gradient-end text-on-accent flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-br px-6 py-2.5 text-sm font-semibold shadow-[0_6px_20px_rgba(36,92,107,0.4)] transition-all hover:brightness-110 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {creating ? (
            <>
              <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              <span>Creando...</span>
            </>
          ) : (
            "Crear rol"
          )}
        </button>
      </div>
    </div>
  );
}
