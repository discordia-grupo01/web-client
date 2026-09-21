"use client";

import { type Member, type PublicUser } from "@discordia/client-shared";

import { Crown } from "lucide-react";
import { useEffect, useState } from "react";

import { ActivityStatusDot } from "@/components/profile/activity-status-dot";
import { ServerAvatar } from "@/components/ui/server-avatar";
import { getPublicProfileRequest } from "@/services/profile/client";
import { listMembersRequest } from "@/services/members/client";

interface MembersSidebarProps {
  serverId: string;
  /** Id del usuario autenticado, para distinguir "yo" en la lista. */
  currentUserId: string | null;
  /** Click en mi propia fila: abre el perfil propio (editable), no el público. */
  onOpenOwnProfile: () => void;
  /**
   * Click en la fila de otro miembro: abre su perfil público (CA1 de
   * "Visualización de perfil público"). La gestión de roles vive dentro de
   * ese modal (`MemberRoleBadges`), no acá.
   */
  onOpenPublicProfile: (userId: string) => void;
}

function MemberAvatar({
  profile,
  userId,
}: {
  profile?: PublicUser;
  userId: string;
}) {
  return (
    <div className="relative shrink-0">
      <ServerAvatar
        name={profile?.name ?? userId}
        src={profile?.avatar_url ? `/api/users/${userId}/avatar` : null}
        size={28}
        className="rounded-full"
      />
      {/* Estado de actividad mock: no hay presencia real en identify-service. */}
      <ActivityStatusDot
        status="online"
        size={10}
        ringColor="var(--bg-channels)"
        className="absolute right-0 bottom-0"
      />
    </div>
  );
}

function MemberRow({
  member,
  profile,
  isOwn,
  onOpenOwnProfile,
  onOpenPublicProfile,
}: {
  member: Member;
  profile?: PublicUser;
  isOwn: boolean;
  onOpenOwnProfile: () => void;
  onOpenPublicProfile: () => void;
}) {
  const displayName = profile?.name ?? member.user_id;

  return (
    <button
      type="button"
      onClick={isOwn ? onOpenOwnProfile : onOpenPublicProfile}
      className="hover:bg-surface-hover flex w-full cursor-pointer items-center gap-2 rounded-md px-1.5 py-1.5 text-left transition-colors"
    >
      <MemberAvatar profile={profile} userId={member.user_id} />
      <span
        className="text-content-muted min-w-0 flex-1 truncate text-sm"
        title={member.user_id}
      >
        {displayName}
        {isOwn ? " (vos)" : ""}
      </span>
      {member.is_owner ? (
        <Crown
          size={13}
          className="text-highlight shrink-0"
          aria-label="Propietario"
        />
      ) : null}
    </button>
  );
}

function MemberGroup({
  label,
  members,
  profiles,
  currentUserId,
  onOpenOwnProfile,
  onOpenPublicProfile,
}: {
  label: string;
  members: Member[];
  profiles: Record<string, PublicUser>;
  currentUserId: string | null;
  onOpenOwnProfile: () => void;
  onOpenPublicProfile: (userId: string) => void;
}) {
  if (members.length === 0) return null;
  return (
    <div>
      <p className="text-content-subtle mb-1 px-1.5 text-[11px] font-semibold tracking-wider uppercase">
        {label} — {members.length}
      </p>
      <div className="space-y-0.5">
        {members.map((member) => (
          <MemberRow
            key={member.user_id}
            member={member}
            profile={profiles[member.user_id]}
            isOwn={member.user_id === currentUserId}
            onOpenOwnProfile={onOpenOwnProfile}
            onOpenPublicProfile={() => onOpenPublicProfile(member.user_id)}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Panel de miembros del server activo. La lista (`user_id`, `is_owner`,
 * `joined_at`) viene de `servers`; el perfil público de cada uno (nombre,
 * avatar) se resuelve aparte contra identify-service (`GET /v1/users/:id`,
 * uno por miembro -- todavía no hay un endpoint batch). Si un lookup falla
 * (usuario borrado, error de red puntual) se muestra el `user_id` crudo como
 * respaldo en vez de romper toda la lista.
 */
export function MembersSidebar({
  serverId,
  currentUserId,
  onOpenOwnProfile,
  onOpenPublicProfile,
}: MembersSidebarProps) {
  const [members, setMembers] = useState<Member[] | null>(null);
  const [profiles, setProfiles] = useState<Record<string, PublicUser>>({});
  const [total, setTotal] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    setMembers(null);
    setProfiles({});
    setErrorMessage("");

    listMembersRequest(serverId).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setErrorMessage(result.message);
        setMembers([]);
        return;
      }
      setMembers(result.members);
      setTotal(result.total);

      for (const member of result.members) {
        getPublicProfileRequest(member.user_id).then((profile) => {
          if (cancelled || !profile.ok) return;
          setProfiles((prev) => ({
            ...prev,
            [member.user_id]: profile.user,
          }));
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [serverId]);

  const owners = members?.filter((member) => member.is_owner) ?? [];
  const regulars = members?.filter((member) => !member.is_owner) ?? [];

  return (
    <div
      className="border-line flex w-60 shrink-0 flex-col overflow-y-auto border-l px-2 py-4"
      style={{ background: "var(--bg-channels)" }}
    >
      <p className="text-content-subtle mb-3 px-1.5 text-[11px] font-semibold tracking-wider uppercase">
        Miembros{members !== null ? ` — ${total}` : ""}
      </p>

      {members === null ? (
        <p className="text-content-subtle px-1.5 text-xs">Cargando...</p>
      ) : errorMessage ? (
        <p className="text-danger px-1.5 text-xs">{errorMessage}</p>
      ) : (
        <div className="space-y-4">
          <MemberGroup
            label="Propietario"
            members={owners}
            profiles={profiles}
            currentUserId={currentUserId}
            onOpenOwnProfile={onOpenOwnProfile}
            onOpenPublicProfile={onOpenPublicProfile}
          />
          <MemberGroup
            label="Miembros"
            members={regulars}
            profiles={profiles}
            currentUserId={currentUserId}
            onOpenOwnProfile={onOpenOwnProfile}
            onOpenPublicProfile={onOpenPublicProfile}
          />
        </div>
      )}
    </div>
  );
}
