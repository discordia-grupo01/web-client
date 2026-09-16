"use client";

import { AlertCircle, Calendar, Camera, Check, Pencil, X } from "lucide-react";
import { useCallback, useRef, useState, type ChangeEvent } from "react";

import { Button } from "@/components/ui/button";
import { ServerAvatar } from "@/components/ui/server-avatar";
import { updateOwnProfileRequest } from "@/services/auth/client";
import type { User } from "@/services/auth/types";
import { cn } from "@/lib/cn";

const MAX_NAME = 100;
const MAX_DESCRIPTION = 500;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/gif"];
const MAX_FILE_MB = 5;

const BANNER_GRADIENT =
  "linear-gradient(135deg, #0f1f2e 0%, #1a3a4a 40%, #245C6B 70%, #1c293b 100%)";

interface OwnProfileModalProps {
  profile: User;
  onClose: () => void;
  onUpdated: (user: User) => void;
}

function formatMemberSince(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

type EditingField = "name" | "description" | null;

export function OwnProfileModal({
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const avatarSrc =
    imagePreview ?? (profile.avatar_url ? "/api/profile/avatar" : null);

  /**
   * `PATCH /v1/me/profile` siempre pide name/description en el multipart --
   * el backend responde 500 si llega vacio (ver identify-service
   * feature/profile) -- asi que estos tres flujos (nombre, descripcion,
   * foto) mandan siempre los tres campos, cambie o no cada uno.
   */
  async function submitProfile(overrides: {
    name?: string;
    description?: string;
    image?: File;
  }): Promise<boolean> {
    setGlobalError("");
    const formData = new FormData();
    formData.set("name", overrides.name ?? profile.name);
    formData.set("description", overrides.description ?? profile.description);
    if (overrides.image) formData.set("image", overrides.image);

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
    if (!ALLOWED_TYPES.includes(file.type)) {
      setImageError("La imagen debe ser JPEG, PNG o GIF.");
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setImageError(`El archivo no puede pesar más de ${MAX_FILE_MB} MB.`);
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="border-line-strong relative flex w-full flex-col overflow-hidden rounded-[20px] border shadow-[0_32px_80px_rgba(0,0,0,0.55)]"
        style={{
          maxWidth: 400,
          maxHeight: "95dvh",
          background: "var(--bg-modal)",
        }}
      >
        {/*
          Portada + avatar viven en un bloque `shrink-0` sin overflow propio:
          el avatar se superpone a la portada con margin-top negativo, y ese
          solapamiento se recorta si queda dentro del contenedor con scroll
          de mas abajo (overflow-y-auto tambien clippea hacia arriba). Solo
          el contenido debajo del avatar scrollea.
        */}
        <div className="relative shrink-0">
          <div
            className="relative h-[100px]"
            style={{ background: BANNER_GRADIENT }}
          >
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  "radial-gradient(ellipse at 30% 50%, rgba(36,92,107,0.8) 0%, transparent 55%), radial-gradient(ellipse at 80% 20%, rgba(252,227,164,0.2) 0%, transparent 50%)",
              }}
            />
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="absolute top-3 right-3 z-10 flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/30 transition-transform hover:scale-110"
            >
              <X size={14} className="text-white/80" />
            </button>
          </div>

          {/* Avatar, superpuesto a la portada y alineado a la izquierda. */}
          <div className="relative px-6" style={{ marginTop: -32 }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Cambiar foto de perfil"
              className="group relative block cursor-pointer rounded-full"
            >
              <ServerAvatar
                name={profile.name}
                src={avatarSrc}
                size={80}
                className="rounded-full"
              />
              <span
                className="absolute inset-0 rounded-full border-4"
                style={{ borderColor: "var(--bg-modal)" }}
                aria-hidden="true"
              />
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
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/gif"
              className="hidden"
              onChange={handleFileInput}
            />
            {imageError ? (
              <p className="text-danger mt-1 text-xs">{imageError}</p>
            ) : null}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-6 pt-3 pb-6">
            {globalError ? (
              <div className="border-danger/30 bg-danger/10 text-danger mb-4 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{globalError}</span>
              </div>
            ) : null}

            {/* Nombre -- el lapiz de aca edita solo el nombre. */}
            {editingField === "name" ? (
              <div className="mb-1 flex items-center gap-2">
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
                  aria-label="Cancelar edición del nombre"
                  className="bg-danger/15 text-danger flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="group/name mb-1 flex items-center gap-1.5">
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
              <p className="text-danger mb-2 text-xs">{nameError}</p>
            ) : null}

            <p className="text-content-subtle mb-3 text-xs">{profile.email}</p>

            {profile.status_text || profile.status_emoji ? (
              <div className="bg-surface-input mb-3 flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs">
                {profile.status_emoji ? (
                  <span>{profile.status_emoji}</span>
                ) : null}
                {profile.status_text ? (
                  <span className="text-content-muted">
                    {profile.status_text}
                  </span>
                ) : null}
              </div>
            ) : null}

            <div className="bg-line mb-4 h-px" />

            {/* Sobre mi -- el lapiz de aca edita solo la descripcion. */}
            <div className="group/desc mb-4">
              <div className="mb-1.5 flex items-center gap-1.5">
                <h3 className="text-content-subtle text-[10px] font-bold tracking-wider uppercase">
                  Sobre mí
                </h3>
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
                    placeholder="Contá algo sobre vos..."
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
                  {profile.description ||
                    "Todavía no agregaste una descripción."}
                </p>
              )}
            </div>

            <div>
              <h3 className="text-content-subtle mb-1.5 text-[10px] font-bold tracking-wider uppercase">
                Miembro desde
              </h3>
              <div className="text-content-muted flex items-center gap-2 text-sm">
                <Calendar size={14} className="text-content-subtle" />
                {formatMemberSince(profile.created_at)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
