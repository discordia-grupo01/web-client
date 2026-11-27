"use client";

import {
  ALLOWED_AVATAR_TYPES,
  CHANGE_AVATAR_LABEL,
  REMOVE_AVATAR_LABEL,
  type User,
  validateAvatar,
} from "@discordia/client-shared";

import { Camera, Trash2 } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { cn } from "@/lib/cn";
import { ownAvatarSrc } from "@/utils/ownAvatar";
import { readFileAsDataUrl } from "@/utils/readFileAsDataUrl";
import { usePresenceOf } from "@/hooks/usePresence";

import { ActivityStatusDot } from "./ActivityStatusDot";
import { OwnAvatarMenu } from "./OwnAvatarMenu";
import { ProfileAvatarFrame } from "./ProfileAvatarFrame";

interface OwnAvatarPickerProps {
  profile: User;
  onUpload: (image: File) => Promise<string | null>;
  onRemove: () => Promise<string | null>;
}

export function OwnAvatarPicker({
  profile,
  onUpload,
  onRemove,
}: OwnAvatarPickerProps) {
  const [imageError, setImageError] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const [isConfirmingRemoveAvatar, setIsConfirmingRemoveAvatar] =
    useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const displayedOwnStatus = usePresenceOf(profile.id);

  const avatarSrc = imagePreview ?? ownAvatarSrc(profile);
  const hasAvatar = Boolean(avatarSrc);

  function processFile(file: File) {
    setImageError("");
    const avatarError = validateAvatar({
      mimeType: file.type,
      sizeBytes: file.size,
    });
    if (avatarError) {
      setImageError(avatarError);
      return;
    }

    void readFileAsDataUrl(file).then(async (previewUrl) => {
      setImagePreview(previewUrl);
      setIsUploadingAvatar(true);
      const error = await onUpload(file);
      setIsUploadingAvatar(false);
      if (error) setImageError(error);
    });
  }

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

  function askRemoveAvatar() {
    setIsAvatarMenuOpen(false);
    if (hasAvatar) setIsConfirmingRemoveAvatar(true);
  }

  async function removeAvatar() {
    setIsConfirmingRemoveAvatar(false);
    setImageError("");
    setIsUploadingAvatar(true);
    const error = await onRemove();
    setIsUploadingAvatar(false);
    if (error) setImageError(error);
    else setImagePreview(null);
  }

  return (
    <>
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
          status={displayedOwnStatus}
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
        <OwnAvatarMenu
          isRemoveDisabled={isUploadingAvatar}
          onPickNew={pickNewAvatar}
          onRemove={askRemoveAvatar}
          onClose={() => setIsAvatarMenuOpen(false)}
        />
      ) : null}
      {isConfirmingRemoveAvatar ? (
        <ConfirmDialog
          icon={Trash2}
          title={REMOVE_AVATAR_LABEL}
          body="¿Querés eliminar tu foto de perfil? Se mostrará tu avatar con inicial."
          confirmLabel="Eliminar"
          onConfirm={removeAvatar}
          onCancel={() => setIsConfirmingRemoveAvatar(false)}
        />
      ) : null}
    </>
  );
}
