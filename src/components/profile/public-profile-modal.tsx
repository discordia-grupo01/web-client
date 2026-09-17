"use client";

import { useEffect, useState } from "react";

import { SectionLabel } from "@/components/ui/section-label";
import { MemberRoleBadges } from "@/components/roles/member-role-badges";
import { getPublicProfileRequest } from "@/services/profile/client";
import type { PublicUser } from "@/types/profile.types";

import { ActivityStatusDot } from "./activity-status-dot";
import { CustomStatusBadge } from "./custom-status-badge";
import { MutualServersList } from "./mutual-servers-list";
import { ProfileAvatarFrame } from "./profile-avatar-frame";
import { ProfileBanner } from "./profile-banner";
import { ProfileModalOverlay } from "./profile-modal-overlay";
import { SuspendedProfile } from "./suspended-profile";

interface PublicProfileModalProps {
  serverId: string;
  userId: string;
  /** El owner del server puede agregar/quitar roles desde acá. */
  canManageRoles: boolean;
  onClose: () => void;
}

/**
 * Perfil público de otro usuario: nombre, foto, descripción, estado de
 * actividad, estado personalizado y servidores en común (CA1 de
 * "Visualización de perfil público" es una lista cerrada -- "únicamente los
 * datos públicos" -- que no incluye fecha de registro, a diferencia del
 * perfil propio). Nunca expone email ni mensajes directos (CA2): esos campos
 * ni siquiera vienen en `PublicUser`. Los roles son de solo lectura acá
 * salvo que `canManageRoles` sea true (el owner del server puede
 * agregar/quitar desde el mismo modal, ver `MemberRoleBadges`).
 */
export function PublicProfileModal({
  serverId,
  userId,
  canManageRoles,
  onClose,
}: PublicProfileModalProps) {
  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    setProfile(null);
    setErrorMessage("");

    getPublicProfileRequest(userId).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setErrorMessage(result.message);
        return;
      }
      setProfile(result.user);
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (profile?.is_suspended) {
    return (
      <ProfileModalOverlay onClose={onClose}>
        <SuspendedProfile onClose={onClose} />
      </ProfileModalOverlay>
    );
  }

  if (errorMessage) {
    return (
      <ProfileModalOverlay onClose={onClose}>
        <ProfileBanner onClose={onClose} />
        <p className="text-danger px-6 py-8 text-center text-sm">
          {errorMessage}
        </p>
      </ProfileModalOverlay>
    );
  }

  if (!profile) {
    return (
      <ProfileModalOverlay onClose={onClose}>
        <ProfileBanner onClose={onClose} />
        <p className="text-content-subtle px-6 py-8 text-center text-sm">
          Cargando perfil...
        </p>
      </ProfileModalOverlay>
    );
  }

  const avatarSrc = profile.avatar_url
    ? `/api/users/${profile.id}/avatar`
    : null;

  return (
    <ProfileModalOverlay onClose={onClose}>
      <div className="relative shrink-0">
        <ProfileBanner onClose={onClose} />
        <ProfileAvatarFrame name={profile.name} src={avatarSrc}>
          {/* Estado de actividad mock: no hay presencia real en identify-service. */}
          <ActivityStatusDot
            status="online"
            className="absolute right-1 bottom-1"
          />
        </ProfileAvatarFrame>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="space-y-4 px-6 pt-3 pb-6">
          <div>
            <h2 className="font-display text-content text-lg font-bold">
              {profile.name}
            </h2>
            <CustomStatusBadge
              statusText={profile.status_text}
              statusEmoji={profile.status_emoji}
            />
          </div>

          <div className="bg-line h-px" />

          <div>
            <SectionLabel>Sobre mí</SectionLabel>
            <p className="text-content-muted mt-1.5 text-sm leading-relaxed">
              {profile.description || "Sin descripción."}
            </p>
          </div>

          <MutualServersList serverIds={profile.mutual_server_ids} />

          <MemberRoleBadges
            serverId={serverId}
            userId={profile.id}
            canManage={canManageRoles}
          />
        </div>
      </div>
    </ProfileModalOverlay>
  );
}
