"use client";

import {
  formatArsFromCents,
  PREMIUM_BENEFITS,
  PREMIUM_PRICE_CENTS,
  premiumActions,
  premiumCancelConfirmation,
  premiumStatusCopy,
  type PremiumView,
} from "@discordia/client-shared";

import { CheckCircle2, Star, XCircle } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FormAlert } from "@/components/ui/FormAlert";
import { cn } from "@/lib/cn";
import { cancelPremiumRequest } from "@/services/billing/client";

import { BILLING_COPY } from "./billingCopy";

const STATE_TONE: Record<PremiumView["state"], string> = {
  none: "text-content-muted",
  processing_first_payment: "text-highlight",
  active: "text-success",
  active_canceled: "text-highlight",
  expired: "text-danger",
};

interface PremiumCardProps {
  premium: PremiumView;
  onSubscribe: () => void;
  onChanged: (premium: PremiumView) => void;
}

export function PremiumCard({
  premium,
  onSubscribe,
  onChanged,
}: PremiumCardProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string>();
  const actions = premiumActions(premium);
  const copy = premiumStatusCopy(premium);

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
    onChanged(result.premium);
  }

  return (
    <section className="border-line-strong bg-surface-raised overflow-hidden rounded-2xl border">
      <div className="from-accent/30 to-info/10 flex flex-wrap items-start justify-between gap-4 bg-gradient-to-br p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="bg-highlight/15 text-highlight flex size-11 shrink-0 items-center justify-center rounded-xl">
            <Star size={22} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-display text-content text-lg font-bold">
                {BILLING_COPY.premiumTitle}
              </h4>
              <span
                className={cn(
                  "bg-surface-input rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                  STATE_TONE[premium.state],
                )}
              >
                {copy.label}
              </span>
            </div>
            <p className="text-content-muted mt-1 text-xs leading-relaxed">
              {copy.detail}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="font-display text-content text-xl font-bold">
            {formatArsFromCents(PREMIUM_PRICE_CENTS)}
          </div>
          <div className="text-content-subtle text-xs">
            {BILLING_COPY.perMonth}
          </div>
        </div>
      </div>

      <div className="space-y-4 p-5 sm:p-6">
        <ul className="grid gap-2 sm:grid-cols-2">
          {PREMIUM_BENEFITS.map((benefit) => (
            <li
              key={benefit}
              className="bg-surface-input text-content-muted flex items-start gap-2 rounded-xl p-3 text-xs leading-relaxed"
            >
              <CheckCircle2
                size={16}
                className={cn(
                  "mt-px shrink-0",
                  actions.benefitsActive ? "text-success" : "text-sky",
                )}
              />
              {benefit}
            </li>
          ))}
        </ul>

        <FormAlert message={error} />

        {actions.canSubscribe || actions.canCancel ? (
          <div className="flex flex-wrap gap-3 sm:[&>*]:w-auto">
            {actions.canSubscribe ? (
              <Button type="button" onClick={onSubscribe}>
                {premium.state === "expired"
                  ? BILLING_COPY.resubscribe
                  : BILLING_COPY.subscribe}
              </Button>
            ) : null}
            {actions.canCancel ? (
              <Button
                type="button"
                variant="secondary"
                isLoading={isCancelling}
                onClick={() => setIsConfirmOpen(true)}
              >
                {premium.state === "active"
                  ? BILLING_COPY.cancelRenewal
                  : BILLING_COPY.cancelSubscription}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      {isConfirmOpen ? (
        <ConfirmDialog
          icon={XCircle}
          title={BILLING_COPY.cancelTitle}
          body={premiumCancelConfirmation(
            actions.benefitsActive ? premium.premium_until : null,
          )}
          confirmLabel={
            premium.state === "active"
              ? BILLING_COPY.cancelRenewal
              : BILLING_COPY.cancelSubscription
          }
          cancelLabel={BILLING_COPY.keepPremium}
          onConfirm={() => void cancel()}
          onCancel={() => setIsConfirmOpen(false)}
        />
      ) : null}
    </section>
  );
}
