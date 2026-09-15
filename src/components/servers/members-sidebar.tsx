"use client";

import { Crown } from "lucide-react";
import { useEffect, useState } from "react";

import { ServerAvatar } from "@/components/servers/server-avatar";
import { getPublicProfileRequest } from "@/features/auth/client";
import { listMembersRequest } from "@/features/servers/client";
import type { Member } from "@/features/servers/types";

interface MembersSidebarProps {
  serverId: string;
  /** Id del usuario autenticado, para distinguir "yo" en la lista. */
  currentUserId: string | null;
  /** Click en mi propia fila: abre el perfil propio (editable), no el público. */
  onOpenOwnProfile: () => void;
}

function MemberRow({
  member,
  name,
  isOwn,
  onOpenOwnProfile,
}: {
  member: Member;
  name?: string;
  isOwn: boolean;
  onOpenOwnProfile: () => void;
}) {
  const displayName = name ?? member.user_id;
  const content = (
    <>
      <ServerAvatar
        name={displayName}
        size={28}
        className="shrink-0 rounded-full"
      />
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
    </>
  );

  if (isOwn) {
    return (
      <button
        type="button"
        onClick={onOpenOwnProfile}
        className="hover:bg-surface-hover flex w-full cursor-pointer items-center gap-2 rounded-md px-1.5 py-1.5 text-left transition-colors"
      >
        {content}
      </button>
    );
  }

  return (
    <div className="hover:bg-surface-hover flex items-center gap-2 rounded-md px-1.5 py-1.5 transition-colors">
      {content}
    </div>
  );
}

function MemberGroup({
  label,
  members,
  names,
  currentUserId,
  onOpenOwnProfile,
}: {
  label: string;
  members: Member[];
  names: Record<string, string>;
  currentUserId: string | null;
  onOpenOwnProfile: () => void;
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
            name={names[member.user_id]}
            isOwn={member.user_id === currentUserId}
            onOpenOwnProfile={onOpenOwnProfile}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Panel de miembros del server activo. La lista (`user_id`, `is_owner`,
 * `joined_at`) viene de `servers`; el nombre de cada uno se resuelve aparte
 * contra identify-service (`GET /v1/users/:id`, uno por miembro -- todavía
 * no hay un endpoint batch). Si un lookup falla (usuario borrado, error de
 * red puntual) se muestra el `user_id` crudo como respaldo en vez de romper
 * toda la lista.
 */
export function MembersSidebar({
  serverId,
  currentUserId,
  onOpenOwnProfile,
}: MembersSidebarProps) {
  const [members, setMembers] = useState<Member[] | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const [total, setTotal] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    setMembers(null);
    setNames({});
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
          setNames((prev) => ({
            ...prev,
            [member.user_id]: profile.user.name,
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
            names={names}
            currentUserId={currentUserId}
            onOpenOwnProfile={onOpenOwnProfile}
          />
          <MemberGroup
            label="Miembros"
            members={regulars}
            names={names}
            currentUserId={currentUserId}
            onOpenOwnProfile={onOpenOwnProfile}
          />
        </div>
      )}
    </div>
  );
}
