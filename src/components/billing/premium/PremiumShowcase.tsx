import {
  BILLING_COPY,
  formatArsFromCents,
  formatMemberSince,
  PREMIUM_PRICE_CENTS,
  PREMIUM_SHOWCASE_BENEFITS,
  premiumActions,
  premiumStatusCopy,
  type PremiumView,
} from "@discordia/client-shared";

import { Button } from "@/components/ui/Button";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { cn } from "@/lib/cn";

import { DiscordiaPremiumMark } from "../icons/DiscordiaIcons";
import { PremiumFacts } from "./PremiumFacts";
import {
  type PremiumArtProfile,
  PremiumShowcaseArt,
} from "./PremiumShowcaseArt";
import { PremiumSubscribeButton } from "./PremiumSubscribeButton";

interface PremiumShowcaseProps {
  premium: PremiumView;
  profile: PremiumArtProfile | null;
  onManage: () => void;
}

export function PremiumShowcase({
  premium,
  profile,
  onManage,
}: PremiumShowcaseProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-content font-display text-xl font-bold">
          {BILLING_COPY.planTitle}
        </h3>
        <p className="text-content-muted mt-1 text-sm">
          {BILLING_COPY.planSubtitle}
        </p>
      </div>

      <PlanCard premium={premium} onManage={onManage} />

      <section className="flex flex-col gap-3">
        <SectionLabel>{BILLING_COPY.benefitsTitle}</SectionLabel>
        <ul className="grid gap-3 sm:grid-cols-2">
          {PREMIUM_SHOWCASE_BENEFITS.map((benefit) => (
            <li
              key={benefit.id}
              className="bg-surface-raised rounded-2xl border border-[#F0B232] p-3.5"
            >
              <PremiumShowcaseArt benefit={benefit.id} profile={profile} />
              <h4 className="font-display text-content mt-3 text-sm font-bold">
                {benefit.title}
              </h4>
              <p className="text-content-muted mt-1 text-xs leading-relaxed">
                {benefit.description}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <PremiumFacts />
    </div>
  );
}

interface PlanCardProps {
  premium: PremiumView;
  onManage: () => void;
}

function PlanCard({ premium, onManage }: PlanCardProps) {
  const actions = premiumActions(premium);

  return (
    <section className="bg-surface-raised flex flex-col gap-5 rounded-2xl border border-[#F0B232] p-5 sm:flex-row sm:items-center [[data-theme=light]_&]:border-[1.5px]">
      <DiscordiaPremiumMark size={64} className="shrink-0" />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="font-display text-content text-lg font-bold">
            {BILLING_COPY.premiumTitle}
          </h4>
          {actions.canSubscribe ? null : (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                actions.benefitsActive
                  ? "bg-success/15 text-success"
                  : "bg-surface-input text-content-subtle",
              )}
            >
              {actions.benefitsActive && premium.premium_until
                ? BILLING_COPY.activeUntil(
                    formatMemberSince(premium.premium_until),
                  )
                : premiumStatusCopy(premium).label}
            </span>
          )}
        </div>
        <p className="text-content-muted mt-1 text-sm">
          <strong className="font-display text-content tabular-nums">
            {formatArsFromCents(PREMIUM_PRICE_CENTS)}
          </strong>{" "}
          {BILLING_COPY.perMonthPlain}
        </p>
      </div>

      {actions.canSubscribe ? (
        <PremiumSubscribeButton
          label={BILLING_COPY.subscribeCta}
          onClick={onManage}
        />
      ) : (
        <Button
          type="button"
          variant="secondary"
          onClick={onManage}
          className="sm:w-auto sm:shrink-0"
        >
          {BILLING_COPY.manage}
        </Button>
      )}
    </section>
  );
}
