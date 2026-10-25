"use client";

import {
  BAN_ACTION_LABEL,
  BLOCK_USER_LABEL,
  KICK_ACTION_LABEL,
  MUTE_ACTION_LABEL,
  mutedUntilLabel,
  UNMUTE_ACTION_LABEL,
  SEND_MESSAGE_LABEL,
  UNBLOCK_USER_LABEL,
  type PublicUser,
} from "@discordia/client-shared";

import {
  Ban,
  Gavel,
  MessageCircle,
  Mic,
  MicOff,
  ShieldCheck,
  UserX,
} from "lucide-react";
import { useEffect, useState } from "react";

import { SectionLabel } from "@/components/ui/SectionLabel";
import { Tooltip } from "@/components/ui/Tooltip";
import { MemberRoleBadges } from "@/components/roles/MemberRoleBadges";
import { useBlockedUsersContext } from "@/contexts/BlockedUsersContext";
import { usePresenceContext } from "@/contexts/PresenceContext";
import { usePresenceOf } from "@/hooks/usePresence";
import { useLoadPresence } from "@/hooks/useLoadPresence";
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
  /** Puede expulsar (permiso) y el perfil no es el propio ni el del owner. */
  canKick?: boolean;
  onKick?: (profile: PublicUser) => void;
  /** Hasta cuando esta silenciado en este servidor; `null` si no lo esta. */
  mutedUntil?: string | null;
  /** Puede silenciar (`MANAGE_MESSAGES`) y el perfil no es el propio ni el del owner. */
  canMute?: boolean;
  onMute?: (profile: PublicUser) => void;
  onUnmute?: (profile: PublicUser) => void;
  /** Muestra la accion de bloquear/desbloquear: el perfil no es el propio. */
  canBlock?: boolean;
  /** Abre el mensaje directo con este usuario. Sin esto (perfil propio) no se muestra el botón. */
  onSendMessage?: (profile: PublicUser) => void;
  onClose: () => void;
}

export function PublicProfileModal({
  serverId,
  userId,
  canManageRoles = false,
  canBan = false,
  onBan,
  canKick = false,
  onKick,
  mutedUntil = null,
  canMute = false,
  onMute,
  onUnmute,
  canBlock = false,
  onSendMessage,
  onClose,
}: PublicProfileModalProps) {
  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const { blockedIds, blockUser, unblockUser } = useBlockedUsersContext();
  const { store: presenceStore } = usePresenceContext();
  const status = usePresenceOf(userId);
  useLoadPresence(presenceStore, [userId]);

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
                {canMute && mutedUntil && onUnmute ? (
                  <Tooltip label={UNMUTE_ACTION_LABEL}>
                    <button
                      type="button"
                      onClick={() => onUnmute(profile)}
                      aria-label={UNMUTE_ACTION_LABEL}
                      className="text-content flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/30 transition-transform hover:scale-110"
                    >
                      <Mic size={14} aria-hidden="true" />
                    </button>
                  </Tooltip>
                ) : null}
                {canMute && !mutedUntil && onMute ? (
                  <Tooltip label={MUTE_ACTION_LABEL}>
                    <button
                      type="button"
                      onClick={() => onMute(profile)}
                      aria-label={MUTE_ACTION_LABEL}
                      className="text-danger flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/30 transition-transform hover:scale-110"
                    >
                      <MicOff size={14} aria-hidden="true" />
                    </button>
                  </Tooltip>
                ) : null}
                {canKick && onKick ? (
                  <Tooltip label={KICK_ACTION_LABEL}>
                    <button
                      type="button"
                      onClick={() => onKick(profile)}
                      aria-label={KICK_ACTION_LABEL}
                      className="text-danger flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/30 transition-transform hover:scale-110"
                    >
                      <UserX size={14} aria-hidden="true" />
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
            <ActivityStatusDot
              status={status}
              ringWidth={3}
              size={16}
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
              {mutedUntil ? (
                <p className="text-danger mt-0.5 flex items-center gap-1.5 text-xs font-semibold">
                  <MicOff size={12} aria-hidden="true" />
                  {mutedUntilLabel(mutedUntil)}
                </p>
              ) : null}
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
