"use client";

import {
  BAN_ACTION_LABEL,
  BLOCK_USER_LABEL,
  SEND_MESSAGE_LABEL,
  UNBLOCK_USER_LABEL,
  type PublicUser,
} from "@discordia/client-shared";

import { Ban, Gavel, MessageCircle, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

import { SectionLabel } from "@/components/ui/SectionLabel";
import { Tooltip } from "@/components/ui/Tooltip";
import { MemberRoleBadges } from "@/components/roles/MemberRoleBadges";
import { useBlockedUsersContext } from "@/services/blocks/BlockedUsersContext";
import { getPublicProfileRequest } from "@/services/profile/client";

import { ActivityStatusDot } from "./ActivityStatusDot";
import { BlockUserModal } from "./BlockUserModal";
import { CustomStatusBadge } from "./CustomStatusBadge";
import { MutualServersList } from "./MutualServersList";
import { ProfileAvatarFrame } from "./ProfileAvatarFrame";
import { ProfileBanner } from "./ProfileBanner";
import { ProfileModalOverlay } from "./ProfileModalOverlay";
import { SuspendedProfile } from "./SuspendedProfile";

interface PublicProfileModalProps {
  /** Sin servidor (perfil abierto desde un mensaje directo) no hay roles que mostrar. */
  serverId?: string;
  userId: string;
  /** El owner del server puede agregar/quitar roles desde acá. */
  canManageRoles?: boolean;
  /** Puede banear (permiso) y el perfil no es el propio ni el del owner. */
  canBan?: boolean;
  onBan?: (profile: PublicUser) => void;
  /** Muestra la accion de bloquear/desbloquear: el perfil no es el propio. */
  canBlock?: boolean;
  /** Abre el mensaje directo con este usuario. Sin esto (perfil propio) no se muestra el botón. */
  onSendMessage?: (profile: PublicUser) => void;
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
  canManageRoles = false,
  canBan = false,
  onBan,
  canBlock = false,
  onSendMessage,
  onClose,
}: PublicProfileModalProps) {
  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const { blockedIds, blockUser, unblockUser } = useBlockedUsersContext();

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

  const isBlocked = blockedIds.has(profile.id);
  const blockLabel = isBlocked ? UNBLOCK_USER_LABEL : BLOCK_USER_LABEL;
  const BlockIcon = isBlocked ? ShieldCheck : Ban;

  return (
    <>
      <ProfileModalOverlay onClose={onClose}>
        <div className="relative shrink-0">
          <ProfileBanner
            onClose={onClose}
            action={
              <>
                {canBlock ? (
                  <Tooltip label={blockLabel}>
                    <button
                      type="button"
                      onClick={() => setIsBlockModalOpen(true)}
                      aria-label={blockLabel}
                      className="text-danger flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/30 transition-transform hover:scale-110"
                    >
                      <BlockIcon size={14} aria-hidden="true" />
                    </button>
                  </Tooltip>
                ) : null}
                {canBan && onBan ? (
                  <Tooltip label={BAN_ACTION_LABEL}>
                    <button
                      type="button"
                      onClick={() => onBan(profile)}
                      aria-label={BAN_ACTION_LABEL}
                      className="text-danger flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/30 transition-transform hover:scale-110"
                    >
                      <Gavel size={14} aria-hidden="true" />
                    </button>
                  </Tooltip>
                ) : null}
              </>
            }
          />
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

            {onSendMessage ? (
              <button
                type="button"
                onClick={() => onSendMessage(profile)}
                className="bg-accent text-on-accent hover:bg-accent-strong flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition-colors"
              >
                <MessageCircle size={16} aria-hidden="true" />
                {SEND_MESSAGE_LABEL}
              </button>
            ) : null}

            <div className="bg-line h-px" />

            <div>
              <SectionLabel>Sobre mí</SectionLabel>
              <p className="text-content-muted mt-1.5 text-sm leading-relaxed">
                {profile.description || "Sin descripción."}
              </p>
            </div>

            <MutualServersList serverIds={profile.mutual_server_ids} />

            {serverId ? (
              <MemberRoleBadges
                serverId={serverId}
                userId={profile.id}
                canManage={canManageRoles}
              />
            ) : null}
          </div>
        </div>
      </ProfileModalOverlay>

      {isBlockModalOpen ? (
        <BlockUserModal
          userName={profile.name}
          isBlocked={isBlocked}
          onConfirm={() =>
            isBlocked ? unblockUser(profile.id) : blockUser(profile.id)
          }
          onClose={() => setIsBlockModalOpen(false)}
        />
      ) : null}
    </>
  );
}
