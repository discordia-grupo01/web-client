"use client";

import {
  type ActivityStatusChoice,
  CUSTOM_STATUS_PLACEHOLDER,
  DESCRIPTION_PLACEHOLDER,
  MAX_CUSTOM_STATUS,
  MAX_DESCRIPTION,
  NO_DESCRIPTION_YET,
  type User,
} from "@discordia/client-shared";

import { useState } from "react";

import { MemberRoleBadges } from "@/components/roles/MemberRoleBadges";
import {
  clearCustomStatusRequest,
  updateCustomStatusRequest,
  updateOwnProfileRequest,
} from "@/services/profile/client";
import { useOwnStatus } from "@/hooks/usePresence";

import { ActivityStatusRow } from "./ActivityStatusRow";
import { EditableTextSection } from "./EditableTextSection";
import { MemberSince } from "./MemberSince";
import { OwnAvatarPicker } from "./OwnAvatarPicker";
import { ProfileBanner } from "./ProfileBanner";
import { ProfileModalOverlay } from "./ProfileModalOverlay";
import { ProfileNameField } from "./ProfileNameField";

interface OwnProfileModalProps {
  /** Sin servidor seleccionado (p.ej. abierto desde el home) no hay roles que mostrar. */
  serverId?: string;
  profile: User;
  onClose: () => void;
  onUpdated: (user: User) => void;
}

export function OwnProfileModal({
  serverId,
  profile,
  onClose,
  onUpdated,
}: OwnProfileModalProps) {
  const { choice: ownChoice, setOwnStatus } = useOwnStatus();
  const [statusError, setStatusError] = useState("");

  async function changeActivityStatus(choice: ActivityStatusChoice) {
    setStatusError("");
    const result = await setOwnStatus(choice);
    if (!result.ok) setStatusError(result.message);
  }

  async function submitProfile(overrides: {
    name?: string;
    description?: string;
    image?: File;
    removeImage?: boolean;
  }): Promise<string | null> {
    const formData = new FormData();
    formData.set("name", overrides.name ?? profile.name);
    formData.set("description", overrides.description ?? profile.description);
    if (overrides.image) formData.set("image", overrides.image);
    if (overrides.removeImage) formData.set("remove_image", "true");

    const result = await updateOwnProfileRequest(formData);
    if (!result.ok) {
      return (
        result.fieldErrors?.name ?? result.fieldErrors?.image ?? result.message
      );
    }
    onUpdated(result.user);
    return null;
  }

  async function saveName(draft: string): Promise<string | null> {
    const name = draft.trim();
    if (!name) return "Ingresá tu nombre.";
    return submitProfile({ name });
  }

  function saveDescription(description: string): Promise<string | null> {
    return submitProfile({ description });
  }

  function uploadAvatar(image: File): Promise<string | null> {
    return submitProfile({ image });
  }

  function removeAvatar(): Promise<string | null> {
    return submitProfile({ removeImage: true });
  }

  async function saveCustomStatus(draft: string): Promise<string | null> {
    const text = draft.trim();
    if (!text) return profile.status_text ? clearCustomStatus() : null;
    const result = await updateCustomStatusRequest(text);
    if (!result.ok) return result.message;
    onUpdated(result.user);
    return null;
  }

  async function clearCustomStatus(): Promise<string | null> {
    const result = await clearCustomStatusRequest();
    if (!result.ok) return result.message;
    onUpdated(result.user);
    return null;
  }

  return (
    <ProfileModalOverlay onClose={onClose}>
      <div className="relative shrink-0">
        <ProfileBanner onClose={onClose} />

        <OwnAvatarPicker
          profile={profile}
          onUpload={uploadAvatar}
          onRemove={removeAvatar}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="space-y-4 px-6 pt-3 pb-6">
          <div>
            <ProfileNameField
              name={profile.name}
              isPremium={profile.premium}
              onSave={saveName}
            />
            <p className="text-content-subtle mt-1 text-xs">{profile.email}</p>
          </div>

          <ActivityStatusRow
            status={ownChoice}
            error={statusError}
            onChange={changeActivityStatus}
          />

          <EditableTextSection
            label="Estado personalizado"
            value={profile.status_text}
            emptyText="Todavía no agregaste un estado personalizado."
            editLabel="Editar estado personalizado"
            maxLength={MAX_CUSTOM_STATUS}
            placeholder={CUSTOM_STATUS_PLACEHOLDER}
            onSave={saveCustomStatus}
          />

          <div className="bg-line h-px" />

          <EditableTextSection
            label="Sobre mí"
            value={profile.description}
            emptyText={NO_DESCRIPTION_YET}
            editLabel="Editar descripción"
            maxLength={MAX_DESCRIPTION}
            placeholder={DESCRIPTION_PLACEHOLDER}
            multiline
            onSave={saveDescription}
          />

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
