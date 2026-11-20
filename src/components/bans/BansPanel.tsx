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
  BANS_SECTION_SUBTITLE,
  BANS_TAB_MEMBERS,
  BANS_TITLE,
  bansTabLabel,
  matchesSearch,
  searchResultsSummary,
  unbanSuccessNotice,
  VIEW_PROFILE_LABEL,
} from "@discordia/client-shared";

import { type ReactNode, useMemo, useState } from "react";

import { useBanCandidates } from "@/components/bans/hooks/useBanCandidates";
import { useBanList } from "@/components/bans/hooks/useBanList";
import { usePagination } from "@/components/bans/hooks/usePagination";
import { FormAlert } from "@/components/ui/FormAlert";
import { PaginationFooter } from "@/components/ui/PaginationFooter";
import { SearchInput } from "@/components/ui/SearchInput";
import { SegmentedTabs } from "@/components/ui/SegmentedTabs";
import { SettingsSection } from "@/components/ui/settings/SettingsSection";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { avatarSrcOf, displayNameOf } from "@/utils/userProfile";

import { type BanTarget } from "./BanMemberModal";
import { UserList, type UserListItem } from "./UserList";
import { type UserRowAction } from "./UserRow";

type Tab = "bans" | "members";

export interface BansPanelProps {
  serverId: string;
  ownerId: string;
  currentUserId: string | null;
  header?: ReactNode;
  onOpenProfile: (userId: string) => void;
  onBanMember: (target: BanTarget) => void;
}

export function BansPanel({
  serverId,
  ownerId,
  currentUserId,
  header,
  onOpenProfile,
  onBanMember,
}: BansPanelProps) {
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
    search,
    enabled: hasOpenedMembers,
  });

  const isBans = tab === "bans";
  const errorMessage = isBans ? banList.errorMessage : candidates.errorMessage;
  const isSearching = search.trim() !== "";

  const banItems = useMemo<UserListItem[] | null>(
    () =>
      banList.bans?.map((ban) => ({
        userId: ban.user_id,
        profile: ban.profile,
        subtitle: ban.reason || BAN_NO_REASON,
      })) ?? null,
    [banList.bans],
  );
  const banMatches = useMemo(
    () =>
      (banItems ?? []).filter((item) =>
        matchesSearch(displayNameOf(item.profile), search),
      ),
    [banItems, search],
  );
  const banPagination = usePagination(banMatches);

  const memberItems = useMemo<UserListItem[] | null>(
    () =>
      candidates.candidates?.map((member) => ({
        userId: member.user_id,
        profile: member.profile,
      })) ?? null,
    [candidates.candidates],
  );

  // Lo que dibuja la pestaña activa, venga de memoria o del back.
  const items = isBans ? banItems : memberItems;
  const pageItems = isBans ? banPagination.pageItems : (memberItems ?? []);
  const pagination = isBans
    ? banPagination
    : {
        page: candidates.page,
        pageCount: candidates.pageCount,
        total: candidates.total,
        range: candidates.range,
        setPage: candidates.setPage,
      };

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
    banPagination.resetPage();
  }

  function actionsFor(item: UserListItem): UserRowAction[] {
    const { userId, profile } = item;
    if (isBans) {
      return [
        {
          label: BAN_REVOKE_LABEL,
          isLoading: revokingUserId === userId,
          onClick: () => handleRevoke(item),
        },
      ];
    }
    return [
      { label: VIEW_PROFILE_LABEL, onClick: () => onOpenProfile(userId) },
      {
        label: BAN_ACTION_LABEL,
        tone: "danger",
        onClick: () =>
          onBanMember({
            userId,
            name: displayNameOf(profile),
            avatarSrc: avatarSrcOf(userId, profile),
          }),
      },
    ];
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    banPagination.resetPage();
  }

  async function handleRevoke({ userId, profile }: UserListItem) {
    setNotice("");
    setRevokeError("");
    setRevokingUserId(userId);
    const result = await banList.unban(userId);
    setRevokingUserId(null);
    if (!result.ok) {
      setRevokeError(result.message);
      return;
    }
    setNotice(unbanSuccessNotice(displayNameOf(profile)));
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {header}
      <SettingsSection
        description={header ? undefined : BANS_SECTION_SUBTITLE}
        toolbar={
          <div className="space-y-3">
            <SegmentedTabs
              label={BANS_TITLE}
              value={tab}
              onChange={handleTabChange}
              tabs={[
                {
                  value: "bans",
                  label: bansTabLabel(banList.bans?.length ?? 0),
                },
                { value: "members", label: BANS_TAB_MEMBERS },
              ]}
            />
            <SearchInput
              value={search}
              onChange={handleSearchChange}
              label={isBans ? BANS_SEARCH_LABEL : BANS_MEMBERS_SEARCH_LABEL}
              placeholder={BANS_SEARCH_PLACEHOLDER}
            />
            {isBans && isSearching ? (
              <p role="status" className="text-content-muted text-xs">
                {searchResultsSummary(
                  banMatches.length,
                  items?.length ?? 0,
                  noun,
                )}
              </p>
            ) : null}
          </div>
        }
        footer={
          pagination.total > 0 ? (
            <PaginationFooter
              page={pagination.page}
              pageCount={pagination.pageCount}
              range={pagination.range}
              total={pagination.total}
              noun={isSearching ? "resultados" : noun}
              onPageChange={pagination.setPage}
              className="border-line shrink-0 gap-3 border-t px-4 py-4 sm:px-8"
            />
          ) : null
        }
      >
        <div role="tabpanel" className="space-y-3">
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
            <LoadingSpinner />
          ) : (
            <UserList
              items={pageItems}
              emptyMessage={emptyMessage}
              actionsFor={actionsFor}
              disableActions={revokingUserId !== null}
            />
          )}
        </div>
      </SettingsSection>
    </div>
  );
}
