"use client";

import {
  BAN_MEMBER_TITLE,
  BAN_PICKER_SEARCH_PLACEHOLDER,
  BANS_MEMBERS_EMPTY,
  BANS_MEMBERS_EMPTY_SEARCH,
  BANS_MEMBERS_SEARCH_LABEL,
} from "@discordia/client-shared";
import { ShieldBan } from "lucide-react";
import { useState } from "react";

import { useBanCandidates } from "@/components/bans/hooks/useBanCandidates";
import { FormAlert } from "@/components/ui/FormAlert";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { PaginationFooter } from "@/components/ui/PaginationFooter";
import { SearchInput } from "@/components/ui/SearchInput";
import { SettingsEmptyState } from "@/components/ui/settings/SettingsEmptyState";
import { SettingsStep } from "@/components/ui/settings/SettingsStep";

import { BanCandidatesTable } from "./BanCandidatesTable";
import { type BanTarget } from "./BanMemberModal";

interface BanMemberPickerStepProps {
  serverId: string;
  ownerId: string;
  currentUserId: string | null;
  onOpenProfile: (userId: string) => void;
  onPick: (target: BanTarget) => void;
  onBack: () => void;
}

export function BanMemberPickerStep({
  serverId,
  ownerId,
  currentUserId,
  onOpenProfile,
  onPick,
  onBack,
}: BanMemberPickerStepProps) {
  const [search, setSearch] = useState("");
  const candidates = useBanCandidates({
    serverId,
    ownerId,
    currentUserId,
    search,
  });
  const members = candidates.candidates;

  return (
    <SettingsStep
      parent="Baneos"
      title={BAN_MEMBER_TITLE}
      description="Lo saca del servidor y le impide volver a entrar."
      onBack={onBack}
    >
      <div className="space-y-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          label={BANS_MEMBERS_SEARCH_LABEL}
          placeholder={BAN_PICKER_SEARCH_PLACEHOLDER}
        />
        <FormAlert message={candidates.errorMessage} />

        {members === null ? (
          <LoadingSpinner />
        ) : members.length === 0 ? (
          <SettingsEmptyState
            icon={ShieldBan}
            text={
              search.trim() ? BANS_MEMBERS_EMPTY_SEARCH : BANS_MEMBERS_EMPTY
            }
          />
        ) : (
          <BanCandidatesTable
            members={members}
            onOpenProfile={onOpenProfile}
            onBan={onPick}
          />
        )}

        {candidates.pageCount > 1 ? (
          <PaginationFooter
            page={candidates.page}
            pageCount={candidates.pageCount}
            range={candidates.range}
            total={candidates.total}
            noun={candidates.isSearching ? "resultados" : "miembros"}
            onPageChange={candidates.setPage}
          />
        ) : null}
      </div>
    </SettingsStep>
  );
}
