import {
  BILLING_COPY,
  formatArsFromCents,
  formatMemberSince,
  PREMIUM_PRICE_CENTS,
  PREMIUM_SHOWCASE_BENEFITS,
  premiumActions,
  type PremiumBenefitId,
  premiumStatusCopy,
  type PremiumView,
} from "@discordia/client-shared";

import { ImagePlay, Paperclip, SmilePlus } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/Button";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { cn } from "@/lib/cn";

import { DiscordiaPremiumBadge, DiscordiaPremiumMark } from "./DiscordiaIcons";
import { PremiumFacts } from "./PremiumFacts";
import { PremiumPill } from "./PremiumPill";
import { PremiumSubscribeButton } from "./PremiumSubscribeButton";

const BENEFIT_ICON: Record<Exclude<PremiumBenefitId, "badge">, ReactNode> = {
  attachments: <Paperclip size={19} />,
  animated: <ImagePlay size={19} />,
  "global-emojis": <SmilePlus size={19} />,
};

const BENEFIT_EXTRA: Partial<Record<PremiumBenefitId, ReactNode>> = {
  attachments: (
    <span className="text-xs tabular-nums">
      <span className="text-content-subtle line-through">10 MB</span>{" "}
      <span className="text-warning font-bold">50 MB</span>
    </span>
  ),
  badge: <PremiumPill />,
};

interface PremiumShowcaseProps {
  premium: PremiumView;
  onManage: () => void;
}

export function PremiumShowcase({ premium, onManage }: PremiumShowcaseProps) {
  const actions = premiumActions(premium);

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
          {PREMIUM_SHOWCASE_BENEFITS.map((benefit) => {
            return (
              <li
                key={benefit.id}
                className="bg-surface-raised border-line flex gap-3 rounded-2xl border p-4"
              >
                {benefit.id === "badge" ? (
                  <div className="flex size-10 shrink-0 items-center justify-center">
                    <DiscordiaPremiumBadge size={40} />
                  </div>
                ) : (
                  <div
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-xl",
                      actions.benefitsActive
                        ? "bg-success/15 text-success"
                        : "bg-warning/10 text-warning",
                    )}
                  >
                    {BENEFIT_ICON[benefit.id]}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                    <p className="font-display text-content text-sm font-semibold">
                      {benefit.title}
                    </p>
                    {BENEFIT_EXTRA[benefit.id] ?? null}
                  </div>
                  <p className="text-content-muted mt-1 text-xs leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <PremiumFacts />
    </div>
  );
}

function PlanCard({ premium, onManage }: PremiumShowcaseProps) {
  const actions = premiumActions(premium);

  return (
    <section className="bg-surface-raised flex flex-col gap-5 rounded-2xl border border-[#F0B232]/30 p-5 sm:flex-row sm:items-center">
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
