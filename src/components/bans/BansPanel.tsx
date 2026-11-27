"use client";

import {
  BAN_MEMBER_TITLE,
  type Ban,
  BANS_EMPTY,
  BANS_EMPTY_SEARCH,
  BANS_REVOKE_HINT,
  BANS_SEARCH_LABEL,
  BANS_SEARCH_PLACEHOLDER,
  BANS_SECTION_SUBTITLE,
  displayNameOf,
  searchResultsSummary,
  unbanSuccessNotice,
} from "@discordia/client-shared";
import { Info, Plus, ShieldBan } from "lucide-react";
import { type ReactNode, useState } from "react";

import { useBanList } from "@/components/bans/hooks/useBanList";
import { Button } from "@/components/ui/Button";
import { FormAlert } from "@/components/ui/FormAlert";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { PaginationFooter } from "@/components/ui/PaginationFooter";
import { SearchInput } from "@/components/ui/SearchInput";
import { SettingsEmptyState } from "@/components/ui/settings/SettingsEmptyState";
import { SettingsGroup } from "@/components/ui/settings/SettingsGroup";
import { SettingsSection } from "@/components/ui/settings/SettingsSection";
import { SettingsToast } from "@/components/ui/settings/SettingsToast";
import { useToast } from "@/hooks/useToast";

import { BanMemberPickerStep } from "./BanMemberPickerStep";
import { type BanTarget } from "./BanMemberModal";
import { BansTable } from "./BansTable";

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
  const [search, setSearch] = useState("");
  const [isPicking, setIsPicking] = useState(false);
  const { toast, showToast } = useToast();
  const [revokeError, setRevokeError] = useState("");
  const [revokingUserId, setRevokingUserId] = useState<string | null>(null);

  const banList = useBanList(serverId, search);
  const isSearching = search.trim() !== "";

  async function handleRevoke(ban: Ban) {
    setRevokeError("");
    setRevokingUserId(ban.user_id);
    const result = await banList.unban(ban.user_id);
    setRevokingUserId(null);
    if (!result.ok) {
      setRevokeError(result.message);
      return;
    }
    showToast(unbanSuccessNotice(displayNameOf(ban.profile)));
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      {header}
      {isPicking ? (
        <BanMemberPickerStep
          serverId={serverId}
          ownerId={ownerId}
          currentUserId={currentUserId}
          onOpenProfile={onOpenProfile}
          onPick={onBanMember}
          onBack={() => setIsPicking(false)}
        />
      ) : (
        <SettingsSection
          description={
            header
              ? undefined
              : "Las personas baneadas no pueden volver a entrar al servidor, ni con una invitación."
          }
          toolbar={
            <div className="space-y-2">
              <SearchInput
                value={search}
                onChange={setSearch}
                label={BANS_SEARCH_LABEL}
                placeholder={BANS_SEARCH_PLACEHOLDER}
              />
              {isSearching ? (
                <p role="status" className="text-content-muted text-xs">
                  {searchResultsSummary(
                    banList.total,
                    banList.allTotal,
                    "baneados",
                  )}
                </p>
              ) : null}
            </div>
          }
        >
          <SettingsGroup
            label={BANS_SECTION_SUBTITLE}
            count={banList.allTotal}
            isAsideStackedOnMobile
            aside={
              <Button
                type="button"
                onClick={() => setIsPicking(true)}
                className="w-auto shrink-0 px-3.5 py-2"
              >
                <Plus size={16} />
                {BAN_MEMBER_TITLE}
              </Button>
            }
          >
            <FormAlert message={banList.errorMessage || revokeError} />

            {banList.bans === null ? (
              <LoadingSpinner />
            ) : banList.bans.length === 0 ? (
              <SettingsEmptyState
                icon={ShieldBan}
                text={isSearching ? BANS_EMPTY_SEARCH : BANS_EMPTY}
              />
            ) : (
              <BansTable
                bans={banList.bans}
                revokingUserId={revokingUserId}
                onRevoke={(ban) => void handleRevoke(ban)}
              />
            )}

            {banList.pageCount > 1 ? (
              <PaginationFooter
                page={banList.page}
                pageCount={banList.pageCount}
                range={banList.range}
                total={banList.total}
                noun={isSearching ? "resultados" : "baneados"}
                onPageChange={banList.setPage}
              />
            ) : null}

            <p className="text-content-subtle flex items-start gap-2 text-xs leading-relaxed">
              <Info size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
              {BANS_REVOKE_HINT}
            </p>
          </SettingsGroup>
        </SettingsSection>
      )}
      <SettingsToast message={toast} />
    </div>
  );
}
