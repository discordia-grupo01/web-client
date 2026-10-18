"use client";

import {
  type Member,
  type MemberPageQuery,
  MEMBERS_EMPTY_SEARCH,
  MEMBERS_SEARCH_LABEL,
  MEMBERS_SEARCH_PLACEHOLDER,
  paginationSummary,
  ROLE_MEMBERS_EMPTY,
  ROLE_MEMBERS_EVERYONE_HINT,
  ROLE_MEMBERS_WITHOUT_EMPTY,
  roleMembersWithoutTab,
  roleMembersWithTab,
} from "@discordia/client-shared";

import { Minus, Plus } from "lucide-react";
import { useCallback, useState } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { FormAlert } from "@/components/ui/FormAlert";
import { Pagination } from "@/components/ui/Pagination";
import { SearchInput } from "@/components/ui/SearchInput";
import { SegmentedTabs } from "@/components/ui/SegmentedTabs";
import { useMemberPages } from "@/hooks/useMemberPages";
import { cn } from "@/lib/cn";
import { avatarSrcOf, displayNameOf } from "@/lib/userProfile";
import {
  assignRoleRequest,
  listRoleMembersRequest,
  removeRoleRequest,
} from "@/services/roles/client";

type Tab = "with" | "without";

interface RoleMembersPanelProps {
  serverId: string;
  roleId: string;
  /** @everyone lo tienen todos y no se puede quitar: no hay "Sin este rol". */
  isEveryone: boolean;
  /** Se asigno (+1) o quito (-1) el rol a alguien, para el contador del encabezado. */
  onMembershipChange: (delta: 1 | -1) => void;
  onError: (message: string) => void;
}

function MemberRoleRow({
  member,
  hasRole,
  isBusy,
  onToggle,
}: {
  member: Member;
  hasRole: boolean;
  isBusy: boolean;
  /** Sin esto (ej. @everyone, que no se puede quitar) no hay boton. */
  onToggle?: () => void;
}) {
  const name = displayNameOf(member.profile);
  return (
    <div className="bg-surface-input border-line flex items-center gap-3 rounded-xl border px-3 py-2.5">
      <Avatar
        name={name}
        src={avatarSrcOf(member.user_id, member.profile)}
        size={32}
        className="shrink-0 rounded-full"
      />
      <span className="text-content min-w-0 flex-1 truncate text-sm font-medium">
        {name}
      </span>
      {onToggle ? (
        <button
          type="button"
          onClick={onToggle}
          disabled={isBusy}
          className={cn(
            "flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50",
            hasRole
              ? "border-danger/25 bg-danger/10 text-danger"
              : "border-accent-strong/30 bg-accent/10 text-accent",
          )}
        >
          {hasRole ? (
            <>
              <Minus size={11} /> Quitar
            </>
          ) : (
            <>
              <Plus size={11} /> Asignar
            </>
          )}
        </button>
      ) : null}
    </div>
  );
}

/**
 * Pestaña "Miembros" de un rol: quienes lo tienen y quienes no, cada lista
 * buscada y paginada en el back (`GET /roles/:id/members`, con
 * `has_role=false` para los que no lo tienen). Para asignar rapido: pestaña
 * "Sin este rol", buscar el nombre y Asignar. Montarlo con `key={roleId}`
 * para que al cambiar de rol arranque de cero.
 */
export function RoleMembersPanel({
  serverId,
  roleId,
  isEveryone,
  onMembershipChange,
  onError,
}: RoleMembersPanelProps) {
  const [tab, setTab] = useState<Tab>("with");
  const [search, setSearch] = useState("");
  const [busyMemberId, setBusyMemberId] = useState<string | null>(null);

  const fetchWith = useCallback(
    (query: MemberPageQuery) => listRoleMembersRequest(roleId, query),
    [roleId],
  );
  const fetchWithout = useCallback(
    (query: MemberPageQuery) =>
      listRoleMembersRequest(roleId, { ...query, hasRole: false }),
    [roleId],
  );
  const withRole = useMemberPages({ fetchPage: fetchWith, search });
  const withoutRole = useMemberPages({
    fetchPage: fetchWithout,
    search,
    enabled: !isEveryone,
  });

  const showsHolders = isEveryone || tab === "with";
  const list = showsHolders ? withRole : withoutRole;
  const emptyMessage = list.isSearching
    ? MEMBERS_EMPTY_SEARCH
    : showsHolders
      ? ROLE_MEMBERS_EMPTY
      : ROLE_MEMBERS_WITHOUT_EMPTY;

  async function handleToggle(member: Member) {
    setBusyMemberId(member.user_id);
    const result = showsHolders
      ? await removeRoleRequest(serverId, member.user_id, roleId)
      : await assignRoleRequest(serverId, member.user_id, roleId);
    setBusyMemberId(null);
    if (!result.ok) {
      onError(result.message);
      return;
    }
    onMembershipChange(showsHolders ? -1 : 1);
    // Paso de una lista a la otra: las dos cambian.
    withRole.reload();
    withoutRole.reload();
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-line shrink-0 space-y-3 border-b px-7 py-4">
        {isEveryone ? (
          <p className="text-content-subtle text-sm">
            {ROLE_MEMBERS_EVERYONE_HINT}
          </p>
        ) : (
          <SegmentedTabs
            label="Miembros del rol"
            value={tab}
            onChange={setTab}
            tabs={[
              { value: "with", label: roleMembersWithTab(withRole.total) },
              {
                value: "without",
                label: roleMembersWithoutTab(withoutRole.total),
              },
            ]}
          />
        )}
        <SearchInput
          value={search}
          onChange={setSearch}
          label={MEMBERS_SEARCH_LABEL}
          placeholder={MEMBERS_SEARCH_PLACEHOLDER}
        />
      </div>

      <div
        role={isEveryone ? undefined : "tabpanel"}
        className="min-h-0 flex-1 space-y-2 overflow-y-auto px-7 py-4"
      >
        <FormAlert message={list.errorMessage} />
        {list.members === null ? (
          list.errorMessage ? null : (
            <div className="flex items-center justify-center py-8">
              <span className="border-line-strong border-t-accent size-6 animate-spin rounded-full border-2" />
            </div>
          )
        ) : list.members.length === 0 ? (
          <p className="text-content-subtle py-2 text-sm">{emptyMessage}</p>
        ) : (
          <div
            className="space-y-1 transition-opacity"
            style={{ opacity: list.isLoading ? 0.6 : 1 }}
          >
            {list.members.map((member) => (
              <MemberRoleRow
                key={member.user_id}
                member={member}
                hasRole={showsHolders}
                isBusy={busyMemberId === member.user_id}
                onToggle={isEveryone ? undefined : () => handleToggle(member)}
              />
            ))}
          </div>
        )}
      </div>

      {list.pageCount > 1 ? (
        <div className="border-line flex shrink-0 flex-col items-center gap-2 border-t px-7 py-3">
          <p aria-live="polite" className="text-content-muted text-xs">
            {paginationSummary(
              list.range.from,
              list.range.to,
              list.total,
              list.isSearching ? "resultados" : "miembros",
            )}
          </p>
          <Pagination
            page={list.page}
            pageCount={list.pageCount}
            onPageChange={list.setPage}
          />
        </div>
      ) : null}
    </div>
  );
}
