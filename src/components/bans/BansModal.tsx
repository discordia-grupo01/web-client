"use client";

import {
  BAN_ACTION_LABEL,
  BAN_NO_REASON,
  BAN_REVOKE_LABEL,
  BANS_EMPTY,
  BANS_EMPTY_SEARCH,
  BANS_MEMBERS_EMPTY,
  BANS_MEMBERS_EMPTY_SEARCH,
  BANS_MEMBERS_HINT,
  BANS_MEMBERS_SEARCH_LABEL,
  BANS_REVOKE_HINT,
  BANS_SEARCH_LABEL,
  BANS_SEARCH_PLACEHOLDER,
  BANS_SUBTITLE,
  BANS_TAB_MEMBERS,
  BANS_TITLE,
  bansTabLabel,
  matchesSearch,
  paginationSummary,
  searchResultsSummary,
  unbanSuccessNotice,
  VIEW_PROFILE_LABEL,
} from "@discordia/client-shared";

import { useMemo, useState } from "react";

import { FormAlert } from "@/components/ui/form-alert";
import { ModalShell } from "@/components/ui/modal-shell";
import { Pagination } from "@/components/ui/Pagination";
import { SearchInput } from "@/components/ui/SearchInput";
import { SegmentedTabs } from "@/components/ui/SegmentedTabs";
import { usePagination } from "@/hooks/usePagination";

import { BanModalHeader } from "./BanModalHeader";
import { avatarSrcOf, displayNameOf } from "./banDisplay";
import { type BanTarget } from "./BanMemberModal";
import { UserList, type UserListItem } from "./UserList";
import { type UserRowAction } from "./UserRow";
import { useBanCandidates } from "./useBanCandidates";
import { useBanList } from "./useBanList";

const TITLE_ID = "bans-modal-title";

type Tab = "bans" | "members";

interface BansModalProps {
  serverId: string;
  ownerId: string;
  currentUserId: string | null;
  /** Abre el perfil del miembro encima de este modal. */
  onOpenProfile: (userId: string) => void;
  /** Abre la confirmacion de baneo de ese miembro, sin pasar por su perfil. */
  onBanMember: (target: BanTarget) => void;
  onClose: () => void;
}

/**
 * Moderacion del servidor en dos pestañas: los baneados (con su revocacion) y
 * los miembros que se pueden banear (que abren su perfil). El back no filtra
 * por nombre ni entrega nombres: la busqueda se hace aca sobre los perfiles ya
 * resueltos y la paginacion es en memoria (`usePagination`).
 */
export function BansModal({
  serverId,
  ownerId,
  currentUserId,
  onOpenProfile,
  onBanMember,
  onClose,
}: BansModalProps) {
  const [tab, setTab] = useState<Tab>("bans");
  const [hasOpenedMembers, setHasOpenedMembers] = useState(false);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [revokeError, setRevokeError] = useState("");
  const [revokingUserId, setRevokingUserId] = useState<string | null>(null);

  const banList = useBanList(serverId);
  const candidates = useBanCandidates({
    serverId,
    ownerId,
    currentUserId,
    enabled: hasOpenedMembers,
  });

  const isBans = tab === "bans";
  const profiles = isBans ? banList.profiles : candidates.profiles;
  const errorMessage = isBans ? banList.errorMessage : candidates.errorMessage;
  const isSearching = search.trim() !== "";

  const items = useMemo<UserListItem[] | null>(() => {
    if (isBans) {
      return (
        banList.bans?.map((ban) => ({
          userId: ban.user_id,
          subtitle: ban.reason || BAN_NO_REASON,
        })) ?? null
      );
    }
    return (
      candidates.candidates?.map((member) => ({
        userId: member.user_id,
      })) ?? null
    );
  }, [isBans, banList.bans, candidates.candidates]);

  const matches = useMemo(
    () =>
      (items ?? []).filter((item) =>
        matchesSearch(
          displayNameOf(item.userId, profiles[item.userId]),
          search,
        ),
      ),
    [items, profiles, search],
  );
  const pagination = usePagination(matches);

  const noun = isBans ? "baneados" : "miembros";
  const emptyMessage = isBans
    ? isSearching
      ? BANS_EMPTY_SEARCH
      : BANS_EMPTY
    : isSearching
      ? BANS_MEMBERS_EMPTY_SEARCH
      : BANS_MEMBERS_EMPTY;

  function handleTabChange(next: Tab) {
    setTab(next);
    if (next === "members") setHasOpenedMembers(true);
    setSearch("");
    setNotice("");
    setRevokeError("");
    pagination.resetPage();
  }

  function actionsFor(userId: string): UserRowAction[] {
    if (isBans) {
      return [{ label: BAN_REVOKE_LABEL, onClick: () => handleRevoke(userId) }];
    }
    return [
      { label: VIEW_PROFILE_LABEL, onClick: () => onOpenProfile(userId) },
      {
        label: BAN_ACTION_LABEL,
        tone: "danger",
        onClick: () =>
          onBanMember({
            userId,
            name: displayNameOf(userId, profiles[userId]),
            avatarSrc: avatarSrcOf(userId, profiles[userId]),
          }),
      },
    ];
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    pagination.resetPage();
  }

  async function handleRevoke(userId: string) {
    setNotice("");
    setRevokeError("");
    setRevokingUserId(userId);
    const result = await banList.unban(userId);
    setRevokingUserId(null);
    if (!result.ok) {
      setRevokeError(result.message);
      return;
    }
    setNotice(unbanSuccessNotice(displayNameOf(userId, profiles[userId])));
  }

  return (
    <ModalShell onClose={onClose} maxWidth={680} labelledBy={TITLE_ID}>
      <BanModalHeader
        titleId={TITLE_ID}
        title={BANS_TITLE}
        subtitle={BANS_SUBTITLE}
      />

      <div className="border-line shrink-0 space-y-3 border-b px-5 py-4 sm:px-7">
        <SegmentedTabs
          label={BANS_TITLE}
          value={tab}
          onChange={handleTabChange}
          tabs={[
            { value: "bans", label: bansTabLabel(banList.bans?.length ?? 0) },
            { value: "members", label: BANS_TAB_MEMBERS },
          ]}
        />
        <SearchInput
          value={search}
          onChange={handleSearchChange}
          label={isBans ? BANS_SEARCH_LABEL : BANS_MEMBERS_SEARCH_LABEL}
          placeholder={BANS_SEARCH_PLACEHOLDER}
        />
        {isSearching ? (
          <p role="status" className="text-content-muted text-xs">
            {searchResultsSummary(matches.length, items?.length ?? 0, noun)}
          </p>
        ) : null}
      </div>

      <div
        role="tabpanel"
        className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-5 py-4 sm:px-7"
      >
        <p className="text-content-muted text-sm">
          {isBans ? BANS_REVOKE_HINT : BANS_MEMBERS_HINT}
        </p>

        {notice ? (
          <p
            role="status"
            className="bg-success/10 text-success rounded-xl px-4 py-3 text-sm"
          >
            {notice}
          </p>
        ) : null}
        <FormAlert message={errorMessage || revokeError} />

        {items === null ? (
          <div className="flex items-center justify-center py-10">
            <span
              role="status"
              aria-label="Cargando"
              className="border-line-strong border-t-accent size-6 animate-spin rounded-full border-2"
            />
          </div>
        ) : (
          <UserList
            items={pagination.pageItems}
            profiles={profiles}
            emptyMessage={emptyMessage}
            actionsFor={actionsFor}
            busyUserId={revokingUserId}
          />
        )}
      </div>

      {pagination.total > 0 ? (
        <div className="border-line flex shrink-0 flex-col items-center gap-3 border-t px-5 py-4 sm:px-7">
          <p aria-live="polite" className="text-content-muted text-xs">
            {paginationSummary(
              pagination.range.from,
              pagination.range.to,
              pagination.total,
              isSearching ? "resultados" : noun,
            )}
          </p>
          <Pagination
            page={pagination.page}
            pageCount={pagination.pageCount}
            onPageChange={pagination.setPage}
          />
        </div>
      ) : null}
    </ModalShell>
  );
}
