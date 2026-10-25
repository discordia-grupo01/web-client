"use client";

import {
  highestRoleOf,
  isMemberMuted,
  type Member,
  type MemberPageQuery,
  MEMBERS_EMPTY_SEARCH,
  MEMBERS_LOADING_MORE,
  MEMBERS_SEARCH_LABEL,
  MEMBERS_SEARCH_PLACEHOLDER,
  mutedUntilLabel,
  type Role,
  type User,
} from "@discordia/client-shared";

import { Crown, MicOff, Search, X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { ActivityStatusDot } from "@/components/profile/ActivityStatusDot";
import { Avatar } from "@/components/ui/Avatar";
import { useMemberScroll } from "@/hooks/useMemberScroll";
import { avatarSrcOf, displayNameOf } from "@/lib/userProfile";
import { listMembersRequest } from "@/services/members/client";
import { usePresenceOf } from "@/services/presence/PresenceContext";

/** A cuantos px del fondo se pide la pagina siguiente. */
const LOAD_MORE_THRESHOLD_PX = 160;

interface MembersSidebarProps {
  serverId: string;
  /** Roles del servidor: el nombre toma el color del rol mas alto de cada miembro. */
  serverRoles: Role[];
  currentUserId: string | null;
  ownProfile: User | null;
  onOpenOwnProfile: () => void;
  /** Recibe el miembro para que el perfil sepa, por ejemplo, si esta silenciado. */
  onOpenPublicProfile: (userId: string, member?: Member) => void;
}

function MemberAvatar({ member }: { member: Member }) {
  const status = usePresenceOf(member.user_id);
  return (
    <div className="relative shrink-0">
      <Avatar
        name={displayNameOf(member.profile)}
        src={avatarSrcOf(member.user_id, member.profile)}
        size={28}
        className="rounded-full"
      />
      <ActivityStatusDot
        status={status}
        size={10}
        ringColor="var(--bg-channels)"
        className="absolute right-0 bottom-0"
      />
    </div>
  );
}

function MemberRow({
  member,
  roleColor,
  statusText,
  statusEmoji,
  isOwn,
  onOpenOwnProfile,
  onOpenPublicProfile,
}: {
  member: Member;
  roleColor: string | null;
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
          style={roleColor ? { color: roleColor } : undefined}
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
      {isMemberMuted(member) && member.muted_until ? (
        <MicOff
          size={13}
          className="text-danger shrink-0"
          aria-label={mutedUntilLabel(member.muted_until)}
        >
          <title>{mutedUntilLabel(member.muted_until)}</title>
        </MicOff>
      ) : null}
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

/** Buscador chico, a la medida del panel (el `SearchInput` de los modales no entra). */
function MemberSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <div className="bg-surface-input border-line focus-within:border-accent flex items-center gap-1.5 rounded-md border px-2 py-1 transition-colors">
      <label htmlFor={id} className="sr-only">
        {MEMBERS_SEARCH_LABEL}
      </label>
      <Search size={12} className="text-content-subtle shrink-0" aria-hidden />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={MEMBERS_SEARCH_PLACEHOLDER}
        autoComplete="off"
        className="text-content placeholder:text-content-subtle min-w-0 flex-1 appearance-none border-none bg-transparent text-xs outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Limpiar búsqueda"
          className="text-content-subtle hover:text-content flex shrink-0 cursor-pointer items-center"
        >
          <X size={12} />
        </button>
      ) : null}
    </div>
  );
}

function MemberGroup({
  label,
  count,
  members,
  serverRoles,
  currentUserId,
  ownProfile,
  onOpenOwnProfile,
  onOpenPublicProfile,
}: {
  label: string;
  /** Cuantos hay en total, aunque todavia no esten todos cargados. */
  count: number;
  members: Member[];
  serverRoles: Role[];
  currentUserId: string | null;
  ownProfile: User | null;
  onOpenOwnProfile: () => void;
  onOpenPublicProfile: (userId: string, member?: Member) => void;
}) {
  if (members.length === 0) return null;
  return (
    <div>
      <p className="text-content-subtle mb-1 px-1.5 text-[11px] font-semibold tracking-wider uppercase">
        {label} — {count}
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
              roleColor={
                highestRoleOf(member.role_ids, serverRoles)?.color ?? null
              }
              statusText={statusSource?.status_text ?? ""}
              statusEmoji={statusSource?.status_emoji ?? ""}
              isOwn={isOwn}
              onOpenOwnProfile={onOpenOwnProfile}
              onOpenPublicProfile={() =>
                onOpenPublicProfile(member.user_id, member)
              }
            />
          );
        })}
      </div>
    </div>
  );
}

export function MembersSidebar({
  serverId,
  serverRoles,
  currentUserId,
  ownProfile,
  onOpenOwnProfile,
  onOpenPublicProfile,
}: MembersSidebarProps) {
  const fetchPage = useCallback(
    (query: MemberPageQuery) => listMembersRequest(serverId, query),
    [serverId],
  );
  const [search, setSearch] = useState("");
  const { members, total, isSearching, isLoadingMore, errorMessage, loadMore } =
    useMemberScroll({ fetchPage, search });
  const scrollRef = useRef<HTMLDivElement>(null);

  function loadMoreIfNearBottom() {
    const element = scrollRef.current;
    if (!element) return;
    const distanceToBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight;
    if (distanceToBottom < LOAD_MORE_THRESHOLD_PX) loadMore();
  }

  // Si la pagina no llega a llenar el panel no hay scroll que dispare la
  // siguiente: se pide sola hasta que haya scroll o no queden.
  useEffect(loadMoreIfNearBottom, [members, loadMore]);

  const owners = members?.filter((member) => member.is_owner) ?? [];
  const regulars = members?.filter((member) => !member.is_owner) ?? [];

  return (
    <div
      ref={scrollRef}
      onScroll={loadMoreIfNearBottom}
      className="border-line flex w-60 shrink-0 flex-col overflow-y-auto border-l px-2 py-4"
      style={{ background: "var(--bg-channels)" }}
    >
      <div
        className="sticky -top-4 z-10 -mx-2 -mt-4 mb-3 space-y-2 px-2 pt-4 pb-1"
        style={{ background: "var(--bg-channels)" }}
      >
        <p className="text-content-subtle px-1.5 text-[11px] font-semibold tracking-wider uppercase">
          Miembros{members !== null && !isSearching ? ` — ${total}` : ""}
        </p>
        <MemberSearch value={search} onChange={setSearch} />
      </div>

      {members === null ? (
        <p className="text-content-subtle px-1.5 text-xs">Cargando...</p>
      ) : errorMessage && members.length === 0 ? (
        <p className="text-danger px-1.5 text-xs">{errorMessage}</p>
      ) : isSearching && members.length === 0 ? (
        <p className="text-content-subtle px-1.5 text-xs">
          {MEMBERS_EMPTY_SEARCH}
        </p>
      ) : (
        <div className="space-y-4">
          {isSearching ? (
            <MemberGroup
              label="Resultados"
              count={total}
              members={members}
              serverRoles={serverRoles}
              currentUserId={currentUserId}
              ownProfile={ownProfile}
              onOpenOwnProfile={onOpenOwnProfile}
              onOpenPublicProfile={onOpenPublicProfile}
            />
          ) : null}
          <MemberGroup
            label="Propietario"
            count={owners.length}
            members={isSearching ? [] : owners}
            serverRoles={serverRoles}
            currentUserId={currentUserId}
            ownProfile={ownProfile}
            onOpenOwnProfile={onOpenOwnProfile}
            onOpenPublicProfile={onOpenPublicProfile}
          />
          <MemberGroup
            label="Miembros"
            count={Math.max(total - 1, regulars.length)}
            members={isSearching ? [] : regulars}
            serverRoles={serverRoles}
            currentUserId={currentUserId}
            ownProfile={ownProfile}
            onOpenOwnProfile={onOpenOwnProfile}
            onOpenPublicProfile={onOpenPublicProfile}
          />
          {isLoadingMore ? (
            <p role="status" className="text-content-subtle px-1.5 text-xs">
              {MEMBERS_LOADING_MORE}
            </p>
          ) : errorMessage ? (
            <p className="text-danger px-1.5 text-xs">{errorMessage}</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
