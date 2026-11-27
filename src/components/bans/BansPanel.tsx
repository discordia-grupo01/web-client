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
  searchResultsSummary,
  unbanSuccessNotice,
} from "@discordia/client-shared";

import { type ReactNode, useMemo, useState } from "react";

import { useBanCandidates } from "@/components/bans/hooks/useBanCandidates";
import { useBanList } from "@/components/bans/hooks/useBanList";
import { FormAlert } from "@/components/ui/FormAlert";
import { PaginationFooter } from "@/components/ui/PaginationFooter";
import { SearchInput } from "@/components/ui/SearchInput";
import { SegmentedTabs } from "@/components/ui/SegmentedTabs";
import { SettingsSection } from "@/components/ui/settings/SettingsSection";
import { SettingsToast } from "@/components/ui/settings/SettingsToast";
import { useToast } from "@/hooks/useToast";
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
  const { toast, showToast } = useToast();
  const [revokeError, setRevokeError] = useState("");
  const [revokingUserId, setRevokingUserId] = useState<string | null>(null);

  const banList = useBanList(serverId, tab === "bans" ? search : "");
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

  const memberItems = useMemo<UserListItem[] | null>(
    () =>
      candidates.candidates?.map((member) => ({
        userId: member.user_id,
        profile: member.profile,
      })) ?? null,
    [candidates.candidates],
  );

  const items = isBans ? banItems : memberItems;
  const pagination = isBans ? banList : candidates;

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
    setRevokeError("");
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

  async function handleRevoke({ userId, profile }: UserListItem) {
    setRevokeError("");
    setRevokingUserId(userId);
    const result = await banList.unban(userId);
    setRevokingUserId(null);
    if (!result.ok) {
      setRevokeError(result.message);
      return;
    }
    showToast(unbanSuccessNotice(displayNameOf(profile)));
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
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
                  label: bansTabLabel(banList.allTotal),
                },
                { value: "members", label: BANS_TAB_MEMBERS },
              ]}
            />
            <SearchInput
              value={search}
              onChange={setSearch}
              label={isBans ? BANS_SEARCH_LABEL : BANS_MEMBERS_SEARCH_LABEL}
              placeholder={BANS_SEARCH_PLACEHOLDER}
            />
            {isBans && isSearching ? (
              <p role="status" className="text-content-muted text-xs">
                {searchResultsSummary(banList.total, banList.allTotal, noun)}
              </p>
            ) : null}
          </div>
        }
      >
        <div role="tabpanel" className="space-y-3">
          <p className="text-content-muted text-sm">
            {isBans ? BANS_REVOKE_HINT : BANS_MEMBERS_HINT}
          </p>

          <FormAlert message={errorMessage || revokeError} />

          {items === null ? (
            <LoadingSpinner />
          ) : (
            <UserList
              items={items}
              emptyMessage={emptyMessage}
              actionsFor={actionsFor}
              onSelect={
                isBans ? undefined : ({ userId }) => onOpenProfile(userId)
              }
              disableActions={revokingUserId !== null}
            />
          )}
          {pagination.pageCount > 1 ? (
            <PaginationFooter
              page={pagination.page}
              pageCount={pagination.pageCount}
              range={pagination.range}
              total={pagination.total}
              noun={isSearching ? "resultados" : noun}
              onPageChange={pagination.setPage}
              className="mt-4"
            />
          ) : null}
        </div>
      </SettingsSection>
      <SettingsToast message={toast} />
    </div>
  );
}
