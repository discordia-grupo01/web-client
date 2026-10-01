"use client";

import { type Member, type User } from "@discordia/client-shared";

import { Crown } from "lucide-react";
import { useEffect, useState } from "react";

import { ActivityStatusDot } from "@/components/profile/activity-status-dot";
import { ServerAvatar } from "@/components/ui/server-avatar";
import { avatarSrcOf, displayNameOf } from "@/lib/userProfile";
import { listMembersRequest } from "@/services/members/client";

interface MembersSidebarProps {
  serverId: string;
  currentUserId: string | null;
  ownProfile: User | null;
  onOpenOwnProfile: () => void;
  onOpenPublicProfile: (userId: string) => void;
}

function MemberAvatar({ member }: { member: Member }) {
  return (
    <div className="relative shrink-0">
      <ServerAvatar
        name={displayNameOf(member.profile)}
        src={avatarSrcOf(member.user_id, member.profile)}
        size={28}
        className="rounded-full"
      />
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
  statusText,
  statusEmoji,
  isOwn,
  onOpenOwnProfile,
  onOpenPublicProfile,
}: {
  member: Member;
  statusText: string;
  statusEmoji: string;
  isOwn: boolean;
  onOpenOwnProfile: () => void;
  onOpenPublicProfile: () => void;
}) {
  const displayName = displayNameOf(member.profile);

  return (
    <button
      type="button"
      onClick={isOwn ? onOpenOwnProfile : onOpenPublicProfile}
      className="hover:bg-surface-hover flex w-full cursor-pointer items-center gap-2 rounded-md px-1.5 py-1.5 text-left transition-colors"
    >
      <MemberAvatar member={member} />
      <div className="min-w-0 flex-1">
        <span
          className="text-content-muted block truncate text-sm"
          title={member.user_id}
        >
          {displayName}
          {isOwn ? " (vos)" : ""}
        </span>
        {statusText || statusEmoji ? (
          <span
            className="text-content-subtle block truncate text-xs"
            title={statusText}
          >
            {statusEmoji ? `${statusEmoji} ` : ""}
            {statusText}
          </span>
        ) : null}
      </div>
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
  currentUserId,
  ownProfile,
  onOpenOwnProfile,
  onOpenPublicProfile,
}: {
  label: string;
  members: Member[];
  currentUserId: string | null;
  ownProfile: User | null;
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
        {members.map((member) => {
          const isOwn = member.user_id === currentUserId;
          const statusSource =
            isOwn && ownProfile ? ownProfile : member.profile;
          return (
            <MemberRow
              key={member.user_id}
              member={member}
              statusText={statusSource?.status_text ?? ""}
              statusEmoji={statusSource?.status_emoji ?? ""}
              isOwn={isOwn}
              onOpenOwnProfile={onOpenOwnProfile}
              onOpenPublicProfile={() => onOpenPublicProfile(member.user_id)}
            />
          );
        })}
      </div>
    </div>
  );
}

export function MembersSidebar({
  serverId,
  currentUserId,
  ownProfile,
  onOpenOwnProfile,
  onOpenPublicProfile,
}: MembersSidebarProps) {
  const [members, setMembers] = useState<Member[] | null>(null);
  const [total, setTotal] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    setMembers(null);
    setErrorMessage("");

    listMembersRequest(serverId).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setErrorMessage(result.message);
        setMembers([]);
        return;
      }
      setTotal(result.total);
      setMembers(result.members);
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
            currentUserId={currentUserId}
            ownProfile={ownProfile}
            onOpenOwnProfile={onOpenOwnProfile}
            onOpenPublicProfile={onOpenPublicProfile}
          />
          <MemberGroup
            label="Miembros"
            members={regulars}
            currentUserId={currentUserId}
            ownProfile={ownProfile}
            onOpenOwnProfile={onOpenOwnProfile}
            onOpenPublicProfile={onOpenPublicProfile}
          />
        </div>
      )}
    </div>
  );
}
