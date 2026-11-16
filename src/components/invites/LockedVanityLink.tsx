import {
  type BoostLevel,
  VANITY_INVITE_LOCKED_COPY,
  vanitySlug,
} from "@discordia/client-shared";
import { Link2 } from "lucide-react";

import { BoostServerButton } from "@/components/boosts/actions/BoostServerButton";
import { BoostBenefitChip } from "@/components/boosts/benefits/BoostBenefitChip";

import { vanityLinkPrefix } from "./VanityLinkText";

interface LockedVanityLinkProps {
  serverName: string;
  level: BoostLevel;
  boostCount: number;
  onBoost: () => void;
  onShowBenefits: () => void;
}

export function LockedVanityLink({
  serverName,
  level,
  boostCount,
  onBoost,
  onShowBenefits,
}: LockedVanityLinkProps) {
  return (
    <section
      aria-label={VANITY_INVITE_LOCKED_COPY.title}
      className="border-line-strong bg-surface-input flex flex-col gap-2.5 rounded-[14px] border border-dashed p-3.5"
    >
      <div className="flex items-center justify-between gap-2.5">
        <strong className="text-content text-[13px]">
          {VANITY_INVITE_LOCKED_COPY.title}
        </strong>
        <BoostBenefitChip
          perk="vanity_url"
          level={level}
          boostCount={boostCount}
        />
      </div>
      <span
        aria-hidden="true"
        className="text-content-subtle flex min-w-0 items-center gap-2 text-sm"
      >
        <Link2 size={15} className="shrink-0" />
        <span className="truncate">
          {vanityLinkPrefix()}
          <strong>{vanitySlug(serverName)}</strong>
        </span>
      </span>
      <p className="text-content-muted text-xs leading-relaxed">
        {VANITY_INVITE_LOCKED_COPY.detail}
      </p>
      <div className="flex items-center gap-2">
        <BoostServerButton onClick={onBoost} />
        <button
          type="button"
          onClick={onShowBenefits}
          className="text-info cursor-pointer px-2 text-[13px] font-semibold hover:underline"
        >
          {VANITY_INVITE_LOCKED_COPY.benefits}
        </button>
      </div>
    </section>
  );
}
