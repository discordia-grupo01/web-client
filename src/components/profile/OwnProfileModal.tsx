"use client";

import {
  displayedStatus,
  type ActivityStatusChoice,
  ALLOWED_AVATAR_TYPES,
  CANCEL_NAME_EDIT_LABEL,
  CHANGE_AVATAR_LABEL,
  DESCRIPTION_PLACEHOLDER,
  MAX_DESCRIPTION,
  MAX_NAME,
  NO_DESCRIPTION_YET,
  REMOVE_AVATAR_LABEL,
  type User,
  validateAvatar,
} from "@discordia/client-shared";

import { AlertCircle, Camera, Check, Pencil, Trash2, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

import { Button } from "@/components/ui/Button";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { MemberRoleBadges } from "@/components/roles/MemberRoleBadges";
import {
  clearCustomStatusRequest,
  updateCustomStatusRequest,
  updateOwnProfileRequest,
} from "@/services/profile/client";
import { cn } from "@/lib/cn";

import { ActivityStatusDot } from "./ActivityStatusDot";
import { ActivityStatusRow } from "./ActivityStatusRow";
import { CustomStatusEditor } from "./CustomStatusEditor";
import { MemberSince } from "./MemberSince";
import { ProfileAvatarFrame } from "./ProfileAvatarFrame";
import { ProfileBanner } from "./ProfileBanner";
import { ProfileModalOverlay } from "./ProfileModalOverlay";

interface OwnProfileModalProps {
  /** Sin servidor seleccionado (p.ej. abierto desde el home) no hay roles que mostrar. */
  serverId?: string;
  profile: User;
  onClose: () => void;
  onUpdated: (user: User) => void;
}

type EditingField = "name" | "description" | null;

export function OwnProfileModal({
  serverId,
  profile,
  onClose,
  onUpdated,
}: OwnProfileModalProps) {
  const [editingField, setEditingField] = useState<EditingField>(null);
  const [nameDraft, setNameDraft] = useState(profile.name);
  const [descriptionDraft, setDescriptionDraft] = useState(profile.description);
  const [nameError, setNameError] = useState("");
  const [imageError, setImageError] = useState("");
  const [globalError, setGlobalError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado de actividad: mock puramente visual, no hay presencia real en
  // identify-service. Se resetea a "En línea" al reabrir el modal a
  // propósito -- no hay nada real que persistir.
  const [activityStatus, setActivityStatus] =
    useState<ActivityStatusChoice>("online");

  const avatarSrc =
    imagePreview ?? (profile.avatar_url ? "/api/profile/avatar" : null);
  const hasAvatar = Boolean(avatarSrc);

  useEffect(() => {
    if (!isAvatarMenuOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      setIsAvatarMenuOpen(false);
    }
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [isAvatarMenuOpen]);

  async function submitProfile(overrides: {
    name?: string;
    description?: string;
    image?: File;
    removeImage?: boolean;
  }): Promise<boolean> {
    setGlobalError("");
    const formData = new FormData();
    formData.set("name", overrides.name ?? profile.name);
    formData.set("description", overrides.description ?? profile.description);
    if (overrides.image) formData.set("image", overrides.image);
    if (overrides.removeImage) formData.set("remove_image", "true");

    const result = await updateOwnProfileRequest(formData);

    if (!result.ok) {
      if (result.fieldErrors?.name) setNameError(result.fieldErrors.name);
      if (result.fieldErrors?.image) setImageError(result.fieldErrors.image);
      if (!result.fieldErrors) setGlobalError(result.message);
      return false;
    }

    onUpdated(result.user);
    return true;
  }

  async function saveCustomStatus(text: string): Promise<boolean> {
    setGlobalError("");
    const result = await updateCustomStatusRequest(text);
    if (!result.ok) {
      setGlobalError(result.message);
      return false;
    }
    onUpdated(result.user);
    return true;
  }

  async function clearCustomStatus(): Promise<boolean> {
    setGlobalError("");
    const result = await clearCustomStatusRequest();
    if (!result.ok) {
      setGlobalError(result.message);
      return false;
    }
    onUpdated(result.user);
    return true;
  }

  function startEditingName() {
    setNameDraft(profile.name);
    setNameError("");
    setGlobalError("");
    setEditingField("name");
  }

  function startEditingDescription() {
    setDescriptionDraft(profile.description);
    setGlobalError("");
    setEditingField("description");
  }

  function cancelEditing() {
    setEditingField(null);
    setNameError("");
    setGlobalError("");
  }

  async function saveName() {
    setNameError("");
    const trimmed = nameDraft.trim();
    if (!trimmed) {
      setNameError("Ingresá tu nombre.");
      return;
    }
    setIsSubmitting(true);
    const ok = await submitProfile({ name: trimmed });
    setIsSubmitting(false);
    if (ok) setEditingField(null);
  }

  async function saveDescription() {
    setIsSubmitting(true);
    const ok = await submitProfile({ description: descriptionDraft });
    setIsSubmitting(false);
    if (ok) setEditingField(null);
  }

  const processFile = useCallback((file: File) => {
    setImageError("");
    const avatarError = validateAvatar({
      mimeType: file.type,
      sizeBytes: file.size,
    });
    if (avatarError) {
      setImageError(avatarError);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      setImagePreview(event.target?.result as string);
      setIsUploadingAvatar(true);
      await submitProfile({ image: file });
      setIsUploadingAvatar(false);
    };
    reader.readAsDataURL(file);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleFileInput(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) processFile(file);
    event.target.value = "";
  }

  function handleAvatarClick() {
    if (hasAvatar) setIsAvatarMenuOpen((open) => !open);
    else fileInputRef.current?.click();
  }

  function pickNewAvatar() {
    setIsAvatarMenuOpen(false);
    fileInputRef.current?.click();
  }

  async function removeAvatar() {
    setIsAvatarMenuOpen(false);
    if (!hasAvatar) return;
    if (
      !window.confirm(
        "¿Querés eliminar tu foto de perfil? Se mostrará tu avatar con inicial.",
      )
    ) {
      return;
    }
    setImageError("");
    setIsUploadingAvatar(true);
    const ok = await submitProfile({ removeImage: true });
    setIsUploadingAvatar(false);
    if (ok) setImagePreview(null);
  }

  return (
    <ProfileModalOverlay onClose={onClose}>
      <div className="relative shrink-0">
        <ProfileBanner onClose={onClose} />

        <ProfileAvatarFrame
          name={profile.name}
          src={avatarSrc}
          onClick={handleAvatarClick}
          ariaLabel={CHANGE_AVATAR_LABEL}
          ariaHasPopup={hasAvatar ? "menu" : undefined}
          ariaExpanded={hasAvatar ? isAvatarMenuOpen : undefined}
        >
          <span
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-full bg-black/55 opacity-0 transition-opacity group-hover:opacity-100",
              isUploadingAvatar && "opacity-100",
            )}
          >
            {isUploadingAvatar ? (
              <span className="size-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <>
                <Camera size={18} className="text-white" />
                <span className="text-[9px] font-semibold text-white">
                  Cambiar
                </span>
              </>
            )}
          </span>
          <ActivityStatusDot
            status={displayedStatus(activityStatus)}
            ringWidth={3}
            size={16}
            className="absolute right-1 bottom-1"
          />
        </ProfileAvatarFrame>
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_AVATAR_TYPES.join(",")}
          className="hidden"
          onChange={handleFileInput}
        />
        {imageError ? (
          <p className="text-danger mt-1 px-6 text-xs">{imageError}</p>
        ) : null}
        {isAvatarMenuOpen ? (
          <>
            <button
              type="button"
              aria-label="Cerrar menú"
              tabIndex={-1}
              onClick={() => setIsAvatarMenuOpen(false)}
              className="fixed inset-0 z-10 cursor-default"
            />
            <div
              role="menu"
              className="bg-surface-modal border-line absolute top-full left-6 z-20 mt-1 w-56 rounded-xl border p-1.5 shadow-xl"
            >
              <button
                type="button"
                role="menuitem"
                onClick={pickNewAvatar}
                autoFocus
                className="text-content hover:bg-surface-input flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors"
              >
                <Camera size={16} />
                {CHANGE_AVATAR_LABEL}
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={removeAvatar}
                disabled={isUploadingAvatar}
                className="text-danger hover:bg-danger/10 flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50"
              >
                <Trash2 size={16} />
                {REMOVE_AVATAR_LABEL}
              </button>
            </div>
          </>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="space-y-4 px-6 pt-3 pb-6">
          {globalError ? (
            <div className="border-danger/30 bg-danger/10 text-danger flex items-start gap-3 rounded-xl border px-4 py-3 text-sm">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{globalError}</span>
            </div>
          ) : null}

          <div>
            {/* Nombre -- el lapiz de aca edita solo el nombre. */}
            {editingField === "name" ? (
              <div className="flex items-center gap-2">
                <input
                  value={nameDraft}
                  onChange={(event) => {
                    setNameDraft(event.target.value);
                    setNameError("");
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") saveName();
                    if (event.key === "Escape") cancelEditing();
                  }}
                  maxLength={MAX_NAME}
                  autoFocus
                  className="bg-surface-input border-line text-content focus:border-accent min-w-0 flex-1 rounded-lg border px-3 py-1.5 text-lg font-bold outline-none"
                />
                <button
                  type="button"
                  onClick={saveName}
                  disabled={isSubmitting}
                  aria-label="Guardar nombre"
                  className="bg-success/15 text-success flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Check size={14} />
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  disabled={isSubmitting}
                  aria-label={CANCEL_NAME_EDIT_LABEL}
                  className="bg-danger/15 text-danger flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="group/name flex items-center gap-1.5">
                <h2 className="font-display text-content text-lg font-bold">
                  {profile.name}
                </h2>
                <button
                  type="button"
                  onClick={startEditingName}
                  aria-label="Editar nombre"
                  title="Editar nombre"
                  className="text-content-subtle hover:text-accent-strong flex size-6 cursor-pointer items-center justify-center rounded-md opacity-0 transition-opacity group-hover/name:opacity-100"
                >
                  <Pencil size={13} />
                </button>
              </div>
            )}
            {editingField === "name" && nameError ? (
              <p className="text-danger mt-1 text-xs">{nameError}</p>
            ) : null}

            <p className="text-content-subtle mt-1 text-xs">{profile.email}</p>
          </div>

          <ActivityStatusRow
            status={activityStatus}
            onChange={setActivityStatus}
          />

          <CustomStatusEditor
            statusText={profile.status_text}
            onSave={saveCustomStatus}
            onClear={clearCustomStatus}
          />

          <div className="bg-line h-px" />

          {/* Sobre mi -- el lapiz de aca edita solo la descripcion. */}
          <div className="group/desc">
            <div className="mb-1.5 flex items-center gap-1.5">
              <SectionLabel>Sobre mí</SectionLabel>
              {editingField !== "description" ? (
                <button
                  type="button"
                  onClick={startEditingDescription}
                  aria-label="Editar descripción"
                  title="Editar descripción"
                  className="text-content-subtle hover:text-accent-strong flex size-5 cursor-pointer items-center justify-center rounded-md opacity-0 transition-opacity group-hover/desc:opacity-100"
                >
                  <Pencil size={12} />
                </button>
              ) : null}
            </div>

            {editingField === "description" ? (
              <div className="space-y-2">
                <div className="flex items-center justify-end">
                  <span className="text-content-subtle font-mono text-[11px] tabular-nums">
                    {descriptionDraft.length}/{MAX_DESCRIPTION}
                  </span>
                </div>
                <textarea
                  value={descriptionDraft}
                  onChange={(event) =>
                    setDescriptionDraft(
                      event.target.value.slice(0, MAX_DESCRIPTION),
                    )
                  }
                  rows={3}
                  autoFocus
                  placeholder={DESCRIPTION_PLACEHOLDER}
                  className="bg-surface-input border-line text-content placeholder:text-content-subtle focus:border-accent w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none"
                />
                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={cancelEditing}
                    disabled={isSubmitting}
                    className="w-auto"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    onClick={saveDescription}
                    isLoading={isSubmitting}
                    className="w-auto"
                  >
                    Guardar
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-content-muted text-sm leading-relaxed">
                {profile.description || NO_DESCRIPTION_YET}
              </p>
            )}
          </div>

          <div className="bg-line h-px" />

          <MemberSince isoDate={profile.created_at} />

          {serverId ? (
            <MemberRoleBadges
              serverId={serverId}
              userId={profile.id}
              canManage={false}
            />
          ) : null}
        </div>
      </div>
    </ProfileModalOverlay>
  );
}
