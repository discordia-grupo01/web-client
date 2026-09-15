"use client";

import {
  AlertCircle,
  Check,
  ChevronRight,
  Minus,
  Pencil,
  Plus,
  Shield,
  Star,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { ColorPanel } from "@/components/servers/color-panel";
import { ServerAvatar } from "@/components/servers/server-avatar";
import { getPublicProfileRequest } from "@/features/auth/client";
import {
  assignRoleRequest,
  createRoleRequest,
  deleteRoleRequest,
  listMemberRolesRequest,
  listMembersRequest,
  listRolesRequest,
  removeRoleRequest,
  setDefaultRoleRequest,
  updateRoleRequest,
} from "@/features/servers/client";
import {
  ROLE_PERMISSIONS,
  type Role,
  type RolePermission,
} from "@/features/servers/types";
import { cn } from "@/lib/cn";

const MAX_NAME = 100;

const COLOR_PALETTE = [
  "#e05252",
  "#e8a800",
  "#38A169",
  "#1abc9c",
  "#245C6B",
  "#6b95bd",
  "#9b59b6",
  "#e91e8c",
  "#e67e22",
  "#f1c40f",
  "#2ecc71",
  "#3498db",
  "#1C293B",
  "#607d8b",
  "#9e9e9e",
  "#8B4513",
];

const PERMISSION_COPY: Record<RolePermission, { label: string; desc: string }> =
  {
    VIEW_CHANNELS: {
      label: "Ver canales",
      desc: "Permite ver los canales del servidor.",
    },
    SEND_MESSAGES: {
      label: "Enviar mensajes",
      desc: "Permite enviar mensajes en canales de texto.",
    },
    MANAGE_CHANNELS: {
      label: "Gestionar canales",
      desc: "Puede crear, editar y eliminar canales.",
    },
    MANAGE_ROLES: {
      label: "Gestionar roles",
      desc: "Puede crear, editar y asignar roles a miembros.",
    },
    KICK_MEMBERS: {
      label: "Expulsar miembros",
      desc: "Puede expulsar miembros del servidor.",
    },
    BAN_MEMBERS: {
      label: "Banear miembros",
      desc: "Puede banear miembros permanentemente.",
    },
    MANAGE_SERVER: {
      label: "Gestionar el servidor",
      desc: "Puede cambiar la configuración del servidor.",
    },
  };

function isValidHex(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="mt-1.5 flex items-center gap-1.5">
      <AlertCircle size={13} className="text-danger" />
      <span className="text-danger text-xs">{message}</span>
    </div>
  );
}

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  const [custom, setCustom] = useState(
    COLOR_PALETTE.includes(value) ? "" : value,
  );
  const [showCustom, setShowCustom] = useState(!COLOR_PALETTE.includes(value));

  return (
    <div>
      <div className="grid grid-cols-8 gap-2">
        {COLOR_PALETTE.map((swatch) => (
          <button
            key={swatch}
            type="button"
            onClick={() => {
              onChange(swatch);
              setShowCustom(false);
            }}
            className="aspect-square w-full cursor-pointer rounded-lg transition-transform hover:scale-110"
            style={{
              background: swatch,
              boxShadow:
                value === swatch
                  ? `0 0 0 2px var(--bg-modal), 0 0 0 4px ${swatch}`
                  : undefined,
            }}
          >
            {value === swatch ? (
              <Check size={12} className="mx-auto text-white" />
            ) : null}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowCustom((prev) => !prev)}
          title="Elegir color personalizado"
          className="border-line-strong text-content-subtle relative flex aspect-square w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed transition-transform hover:scale-110"
          style={{
            background:
              showCustom && isValidHex(custom) ? custom : "transparent",
          }}
        >
          {showCustom && isValidHex(custom) ? (
            <Pencil size={12} />
          ) : (
            <Plus size={14} />
          )}
        </button>
      </div>

      {showCustom ? (
        <div className="mt-3 space-y-3">
          <ColorPanel
            hex={isValidHex(custom) ? custom : "#000000"}
            onChange={(next) => {
              setCustom(next);
              onChange(next);
            }}
          />
          <div className="flex items-center gap-2">
            <div
              className="border-line size-8 shrink-0 rounded-lg border"
              style={{
                background: isValidHex(custom) ? custom : "var(--bg-input)",
              }}
            />
            <div className="bg-surface-input border-line flex flex-1 items-center rounded-xl border px-3 py-2">
              <input
                type="text"
                value={custom}
                onChange={(event) => {
                  const next = event.target.value;
                  setCustom(next);
                  if (isValidHex(next)) onChange(next);
                }}
                placeholder="#3d9bb5"
                maxLength={7}
                className="text-content min-w-0 flex-1 border-none bg-transparent font-mono text-sm outline-none"
              />
            </div>
            {isValidHex(custom) ? (
              <Check size={14} className="text-success shrink-0" />
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PermissionToggle({
  perm,
  enabled,
  onChange,
}: {
  perm: RolePermission;
  enabled: boolean;
  onChange: (value: boolean) => void;
}) {
  const copy = PERMISSION_COPY[perm];
  return (
    <div
      onClick={() => onChange(!enabled)}
      className={cn(
        "flex cursor-pointer items-start justify-between gap-4 rounded-xl border px-4 py-3 transition-all",
        enabled
          ? "border-accent-strong bg-accent/10"
          : "bg-surface-input border-line",
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-content text-sm font-semibold">{copy.label}</p>
        <p className="text-content-subtle mt-0.5 text-xs">{copy.desc}</p>
      </div>
      <div
        className={cn(
          "mt-0.5 flex h-6 w-10 shrink-0 items-center rounded-full p-0.5 transition-all",
          enabled ? "bg-accent justify-end" : "bg-line-strong justify-start",
        )}
      >
        <div className="size-5 rounded-full bg-white shadow-sm" />
      </div>
    </div>
  );
}

interface MemberInfo {
  user_id: string;
  name: string;
  roleIds: string[];
}

function MemberRoleRow({
  member,
  hasRole,
  isBusy,
  onToggle,
}: {
  member: MemberInfo;
  hasRole: boolean;
  isBusy: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="bg-surface-input border-line flex items-center gap-3 rounded-xl border px-3 py-2.5">
      <ServerAvatar
        name={member.name}
        size={32}
        className="shrink-0 rounded-full"
      />
      <span className="text-content min-w-0 flex-1 truncate text-sm font-medium">
        {member.name}
      </span>
      <button
        type="button"
        onClick={onToggle}
        disabled={isBusy}
        className={cn(
          "flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50",
          hasRole
            ? "border-danger/25 bg-danger/10 text-danger"
            : "border-accent-strong/30 bg-accent/10 text-accent",
        )}
      >
        {hasRole ? (
          <>
            <Minus size={11} /> Quitar
          </>
        ) : (
          <>
            <Plus size={11} /> Asignar
          </>
        )}
      </button>
    </div>
  );
}

interface RolesModalProps {
  serverId: string;
  serverName: string;
  onClose: () => void;
}

type RightView = "edit" | "members" | "create";

/**
 * Panel maestro-detalle de roles: lista a la izquierda, edicion/creacion a la
 * derecha, tab de miembros por rol. Owner-only del lado del back
 * (RequireManageRoles). El back no expone en ningun lado cual es el rol por
 * defecto actual (ver nota en features/servers/service.ts) -- `defaultRoleId`
 * arranca en null y solo se conoce dentro de esta sesion si alguien lo fija
 * desde aca.
 */
export function RolesModal({ serverId, serverName, onClose }: RolesModalProps) {
  const [roles, setRoles] = useState<Role[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [rightView, setRightView] = useState<RightView>("edit");
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
  const [newNameError, setNewNameError] = useState("");
  const [newColorError, setNewColorError] = useState("");
  const [creating, setCreating] = useState(false);

  // Members tab
  const [membersInfo, setMembersInfo] = useState<MemberInfo[] | null>(null);
  const [membersError, setMembersError] = useState("");
  const [busyMemberId, setBusyMemberId] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  function loadMembers() {
    if (membersInfo !== null || membersError) return;
    setMembersError("");
    listMembersRequest(serverId).then((result) => {
      if (!result.ok) {
        setMembersError(result.message);
        setMembersInfo([]);
        return;
      }
      Promise.all(
        result.members.map(async (member) => {
          const [profile, memberRoles] = await Promise.all([
            getPublicProfileRequest(member.user_id),
            listMemberRolesRequest(serverId, member.user_id),
          ]);
          return {
            user_id: member.user_id,
            name: profile.ok ? profile.user.name : member.user_id,
            roleIds: memberRoles.ok ? memberRoles.roles.map((r) => r.id) : [],
          };
        }),
      ).then((infos) => setMembersInfo(infos));
    });
  }

  function selectRole(id: string) {
    setSelectedId(id);
    setRightView("edit");
  }

  const membersWithRole = (membersInfo ?? []).filter((m) =>
    m.roleIds.includes(selectedId),
  );
  const membersWithoutRole = (membersInfo ?? []).filter(
    (m) => !m.roleIds.includes(selectedId),
  );

  async function handleToggleMember(member: MemberInfo, hasRole: boolean) {
    setBusyMemberId(member.user_id);
    const result = hasRole
      ? await removeRoleRequest(serverId, member.user_id, selectedId)
      : await assignRoleRequest(serverId, member.user_id, selectedId);
    setBusyMemberId(null);
    if (!result.ok) {
      showToast(result.message);
      return;
    }
    setMembersInfo(
      (prev) =>
        prev?.map((m) =>
          m.user_id === member.user_id
            ? {
                ...m,
                roleIds: hasRole
                  ? m.roleIds.filter((id) => id !== selectedId)
                  : [...m.roleIds, selectedId],
              }
            : m,
        ) ?? null,
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
    setEditPerms((prev) =>
      on ? [...prev, perm] : prev.filter((p) => p !== perm),
    );
    setIsDirty(true);
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

  async function handleSave() {
    setNameError("");
    setColorError("");
    const trimmed = editName.trim();
    if (!trimmed) {
      setNameError("El nombre del rol no puede estar vacío.");
      return;
    }
    if (trimmed.length > MAX_NAME) {
      setNameError("El nombre no puede superar los 100 caracteres.");
      return;
    }
    if (!isValidHex(editColor)) {
      setColorError("Seleccioná un color válido.");
      return;
    }
    const dup = (roles ?? []).find(
      (r) =>
        r.id !== selectedId && r.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (dup) {
      setNameError("Ya existe un rol con ese nombre.");
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
    if (!selectedRole) return;
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
    if (!selectedRole) return;
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
    showToast(`Rol "${selectedRole.name}" eliminado`);
  }

  async function handleCreate() {
    setNewNameError("");
    setNewColorError("");
    const trimmed = newName.trim();
    if (!trimmed) {
      setNewNameError("El nombre del rol no puede estar vacío.");
      return;
    }
    if (trimmed.length > MAX_NAME) {
      setNewNameError("El nombre no puede superar los 100 caracteres.");
      return;
    }
    if (!isValidHex(newColor)) {
      setNewColorError("Seleccioná un color válido.");
      return;
    }
    const dup = (roles ?? []).find(
      (r) => r.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (dup) {
      setNewNameError("Ya existe un rol con ese nombre.");
      return;
    }

    setCreating(true);
    const result = await createRoleRequest(serverId, {
      name: trimmed,
      color: newColor,
    });
    setCreating(false);

    if (!result.ok) {
      if (result.fieldErrors?.name) setNewNameError(result.fieldErrors.name);
      if (result.fieldErrors?.color) setNewColorError(result.fieldErrors.color);
      if (!result.fieldErrors) showToast(result.message);
      return;
    }

    setRoles((prev) => [...(prev ?? []), result.role]);
    setNewName("");
    setNewColor(COLOR_PALETTE[0]);
    setSelectedId(result.role.id);
    setRightView("edit");
    showToast(`Rol "${trimmed}" creado`);
  }

  const isLoading = roles === null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="border-line-strong relative flex w-full overflow-hidden rounded-[20px] border shadow-[0_32px_80px_rgba(0,0,0,0.55)]"
        style={{
          maxWidth: 740,
          height: "88dvh",
          background: "var(--bg-modal)",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        {/* Left panel */}
        <div className="bg-surface-sunken border-line flex w-[220px] shrink-0 flex-col overflow-hidden border-r">
          <div className="border-line flex-shrink-0 border-b px-4 pt-5 pb-3">
            <div className="mb-3 flex items-center gap-2">
              <Shield size={16} className="text-content" />
              <h2 className="text-content font-display text-sm font-bold tracking-wider uppercase">
                Roles
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setRightView("create")}
              className="from-accent flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br to-[#1a4050] py-2 text-xs font-semibold text-white transition-all hover:brightness-110"
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
              <p className="text-content-muted px-2 py-2 text-xs">
                Todavía no hay roles.
              </p>
            ) : (
              (roles ?? []).map((role) => {
                const isSelected =
                  role.id === selectedId && rightView !== "create";
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => selectRole(role.id)}
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
                    <span className="flex shrink-0 items-center gap-1">
                      {role.id === defaultRoleId ? (
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
              })
            )}
          </div>

          <div className="border-line flex-shrink-0 border-t p-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-surface-input border-line text-content-subtle w-full cursor-pointer rounded-xl border py-2 text-xs font-semibold transition-all hover:brightness-110"
            >
              Cerrar
            </button>
          </div>
        </div>

        {/* Right panel */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {rightView === "create" ? (
            <div className="flex h-full flex-col">
              <div className="border-line flex-shrink-0 border-b px-7 pt-7 pb-4">
                <h3 className="text-content font-display text-lg font-bold">
                  Crear rol
                </h3>
                <p className="text-content-subtle mt-0.5 text-xs">
                  El nuevo rol se crea sin permisos. Podés configurarlos
                  después.
                </p>
              </div>
              <div className="flex-1 space-y-6 overflow-y-auto px-7 py-6">
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
              </div>

              <div className="border-line flex flex-shrink-0 items-center justify-end gap-3 border-t px-7 py-4">
                <button
                  type="button"
                  onClick={() => setRightView("edit")}
                  className="bg-surface-input border-line text-content-muted cursor-pointer rounded-xl border px-5 py-2.5 text-sm font-semibold transition-all hover:brightness-110"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={creating}
                  className="from-accent flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-br to-[#1a4050] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_6px_20px_rgba(36,92,107,0.4)] transition-all hover:brightness-110 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
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
          ) : selectedRole ? (
            <>
              <div className="flex-shrink-0 px-7 pt-6 pb-0">
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
                        {membersWithRole.length}{" "}
                        {membersWithRole.length === 1 ? "miembro" : "miembros"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-line flex gap-1 border-b">
                  {(["edit", "members"] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => {
                        setRightView(tab);
                        if (tab === "members") loadMembers();
                      }}
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
                <div className="flex-1 space-y-6 overflow-y-auto px-7 py-5">
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
                        className="text-content min-w-0 flex-1 border-none bg-transparent text-sm outline-none"
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
                  </div>

                  <div>
                    <label className="text-content-subtle mb-3 block text-xs font-bold tracking-wider uppercase">
                      Color <span className="text-danger">*</span>
                    </label>
                    <ColorPicker value={editColor} onChange={handleEditColor} />
                    <FieldError message={colorError} />
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
                          onChange={(on) => handleTogglePerm(perm, on)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="border-danger/20 bg-danger/[0.06] space-y-3 rounded-xl border p-4">
                    <p className="text-danger text-[10px] font-bold tracking-widest uppercase">
                      Zona peligrosa
                    </p>

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
                          disabled={settingDefault}
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
                          Este es el rol por defecto. Para eliminarlo, primero
                          definí otro rol como predeterminado.
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
                        className="text-danger border-danger/25 bg-danger/10 flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-all hover:brightness-110"
                      >
                        <Trash2 size={12} /> Eliminar rol
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-danger font-display text-xs font-semibold">
                          ¿Confirmar eliminación de &quot;{selectedRole.name}
                          &quot;?
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
                            disabled={deleting}
                            className="flex-1 cursor-pointer rounded-lg bg-gradient-to-br from-[#c0392b] to-[#922b21] py-2 text-xs font-semibold text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            {deleting ? "Eliminando..." : "Eliminar"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {savedOk ? (
                    <div className="border-success/30 bg-success/10 text-success flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm">
                      <Check size={14} />
                      <span>Cambios guardados.</span>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="flex-1 space-y-4 overflow-y-auto px-7 py-5">
                  {membersError ? (
                    <p className="text-danger text-xs">{membersError}</p>
                  ) : membersInfo === null ? (
                    <div className="flex items-center justify-center py-8">
                      <span className="border-line-strong border-t-accent size-6 animate-spin rounded-full border-2" />
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="text-content-subtle mb-3 text-xs font-bold tracking-wider uppercase">
                          Con este rol ({membersWithRole.length})
                        </p>
                        {membersWithRole.length === 0 ? (
                          <p className="text-content-subtle text-sm">
                            Ningún miembro tiene este rol.
                          </p>
                        ) : null}
                        <div className="space-y-1">
                          {membersWithRole.map((member) => (
                            <MemberRoleRow
                              key={member.user_id}
                              member={member}
                              hasRole
                              isBusy={busyMemberId === member.user_id}
                              onToggle={() => handleToggleMember(member, true)}
                            />
                          ))}
                        </div>
                      </div>

                      {membersWithoutRole.length > 0 ? (
                        <div>
                          <p className="text-content-subtle mb-3 text-xs font-bold tracking-wider uppercase">
                            Sin este rol ({membersWithoutRole.length})
                          </p>
                          <div className="space-y-1">
                            {membersWithoutRole.map((member) => (
                              <MemberRoleRow
                                key={member.user_id}
                                member={member}
                                hasRole={false}
                                isBusy={busyMemberId === member.user_id}
                                onToggle={() =>
                                  handleToggleMember(member, false)
                                }
                              />
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              )}

              {rightView === "edit" ? (
                <div className="border-line flex flex-shrink-0 items-center justify-end gap-3 border-t px-7 py-4">
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
                    onClick={handleSave}
                    disabled={!isDirty || saving}
                    className="from-accent flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-br to-[#1a4050] px-6 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
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
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
              <Shield size={36} className="text-content-subtle" />
              <p className="text-content-subtle text-sm">
                Seleccioná un rol de la lista para editarlo.
              </p>
            </div>
          )}
        </div>

        {/* Toast */}
        <div
          className="bg-surface-raised border-line-strong pointer-events-none absolute left-1/2 flex min-w-[200px] -translate-x-1/2 items-center gap-2.5 rounded-xl border px-4 py-2.5 shadow-xl transition-all duration-300"
          style={{
            bottom: toast ? 20 : -60,
            opacity: toast ? 1 : 0,
            zIndex: 999,
          }}
        >
          <span className="bg-accent size-2 shrink-0 rounded-full" />
          <p className="text-content font-display text-sm font-semibold">
            {toast}
          </p>
        </div>
      </div>
    </div>
  );
}
