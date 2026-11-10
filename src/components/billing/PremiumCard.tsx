"use client";

import {
  BILLING_COPY,
  formatArsFromCents,
  PREMIUM_PRICE_CENTS,
  PREMIUM_STATE_TONE,
  premiumActionLabels,
  premiumActions,
  premiumCancelConfirmation,
  premiumStatusCopy,
  type PremiumView,
} from "@discordia/client-shared";

import { XCircle } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FormAlert } from "@/components/ui/FormAlert";
import { cn } from "@/lib/cn";
import { cancelPremiumRequest } from "@/services/billing/client";

import { BILLING_TONE_CLASS } from "./billingTone";
import { DiscordiaPremiumMark } from "./DiscordiaIcons";
import { PremiumSubscribeButton } from "./PremiumSubscribeButton";

interface PremiumCardProps {
  premium: PremiumView;
  onSubscribe: () => void;
  onChanged: (premium: PremiumView) => void;
  onShowPlan?: () => void;
}

export function PremiumCard({
  premium,
  onSubscribe,
  onChanged,
  onShowPlan,
}: PremiumCardProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string>();
  const actions = premiumActions(premium);
  const copy = premiumStatusCopy(premium);
  const labels = premiumActionLabels(premium);

  async function cancel() {
    setIsConfirmOpen(false);
    setIsCancelling(true);
    setError(undefined);
    const result = await cancelPremiumRequest();
    setIsCancelling(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    onChanged(result.data);
  }

  return (
    <div className="flex flex-col gap-3">
      <section className="bg-surface-raised flex flex-col gap-5 rounded-2xl border border-[#F0B232]/30 p-5 sm:flex-row sm:items-center">
        <DiscordiaPremiumMark size={64} className="shrink-0" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-display text-content text-lg font-bold">
              {BILLING_COPY.premiumTitle}
            </h4>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                BILLING_TONE_CLASS[PREMIUM_STATE_TONE[premium.state]],
              )}
            >
              {copy.label}
            </span>
          </div>
          <p className="text-content-muted mt-1 text-sm leading-relaxed">
            {copy.detail}
          </p>
          <p className="text-content-muted mt-1 text-sm">
            <strong className="font-display text-content tabular-nums">
              {formatArsFromCents(PREMIUM_PRICE_CENTS)}
            </strong>{" "}
            {BILLING_COPY.perMonthPlain}
          </p>
        </div>

        {actions.canSubscribe || actions.canCancel ? (
          <div className="flex shrink-0 flex-col gap-2">
            {actions.canSubscribe ? (
              <PremiumSubscribeButton
                label={labels.subscribe}
                onClick={onSubscribe}
              />
            ) : null}
            {actions.canCancel ? (
              <Button
                type="button"
                variant="secondary"
                isLoading={isCancelling}
                onClick={() => setIsConfirmOpen(true)}
                className="sm:w-auto"
              >
                {labels.cancel}
              </Button>
            ) : null}
          </div>
        ) : null}
      </section>

      <FormAlert message={error} />

      {premium.state === "none" && onShowPlan ? (
        <p className="text-content-muted text-sm">
          {BILLING_COPY.noSubscription}{" "}
          <button
            type="button"
            onClick={onShowPlan}
            className="text-accent-strong cursor-pointer font-semibold underline-offset-2 hover:underline"
          >
            {BILLING_COPY.discoverPremium}
          </button>
        </p>
      ) : null}

      {isConfirmOpen ? (
        <ConfirmDialog
          icon={XCircle}
          title={BILLING_COPY.cancelTitle}
          body={premiumCancelConfirmation(
            actions.benefitsActive ? premium.premium_until : null,
          )}
          confirmLabel={labels.cancel}
          cancelLabel={BILLING_COPY.keepPremium}
          onConfirm={() => void cancel()}
          onCancel={() => setIsConfirmOpen(false)}
        />
      ) : null}
    </div>
  );
}
