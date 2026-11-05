"use client";

import { formatPoints, PREMIUM_PRICE_CENTS } from "@discordia/client-shared";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { FormAlert } from "@/components/ui/FormAlert";
import { useAuth } from "@/contexts/AuthContext";

import { BILLING_COPY } from "./billingCopy";
import type { BillingSection } from "./billingSections";
import {
  CheckoutConfirmModal,
  type CheckoutItem,
} from "./CheckoutConfirmModal";
import { DiscordiaPointIcon } from "./DiscordiaIcons";
import { useBillingOverview } from "./hooks/useBillingOverview";
import { useCheckout } from "./hooks/useCheckout";
import { PointMovements } from "./PointMovements";
import { PointsShop } from "./PointsShop";
import { PremiumCard } from "./PremiumCard";
import { PremiumFacts } from "./PremiumFacts";
import { PremiumShowcase } from "./PremiumShowcase";
import { PurchaseHistory } from "./PurchaseHistory";

const TAB_HEADER: Record<
  Exclude<BillingSection, "premium">,
  { title: string; subtitle: string }
> = {
  subscriptions: {
    title: BILLING_COPY.subscriptionsTitle,
    subtitle: BILLING_COPY.subscriptionsSubtitle,
  },
  points: {
    title: BILLING_COPY.pointsTitle,
    subtitle: BILLING_COPY.pointsSubtitle,
  },
  transactions: {
    title: BILLING_COPY.transactionsTitle,
    subtitle: BILLING_COPY.transactionsSubtitle,
  },
};

interface BillingSettingsProps {
  tab: BillingSection;
  onNavigate: (tab: BillingSection) => void;
}

export function BillingSettings({ tab, onNavigate }: BillingSettingsProps) {
  const { user } = useAuth();
  const { state, reload, setPremium } = useBillingOverview();
  const checkout = useCheckout();
  const [item, setItem] = useState<CheckoutItem | null>(null);

  function closeCheckout() {
    setItem(null);
    checkout.reset();
  }

  function confirmCheckout(payerEmail: string) {
    if (!item) return;
    if (item.kind === "premium") void checkout.startPremium(payerEmail);
    else void checkout.startPoints(item.packageId);
  }

  if (state.status === "loading") {
    return <p className="text-content-muted text-sm">{BILLING_COPY.loading}</p>;
  }

  if (state.status === "error") {
    return (
      <div className="flex max-w-md flex-col gap-4">
        <FormAlert message={state.message} />
        <Button type="button" variant="secondary" onClick={() => void reload()}>
          {BILLING_COPY.retry}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-7">
      {tab !== "premium" ? (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-content font-display text-xl font-bold">
              {TAB_HEADER[tab].title}
            </h3>
            <p className="text-content-muted mt-1 text-sm">
              {TAB_HEADER[tab].subtitle}
            </p>
          </div>
          {tab === "points" ? (
            <div className="border-line bg-surface-raised rounded-xl border px-3 py-2 text-right">
              <div className="text-content-subtle text-[10px] font-bold tracking-wider uppercase">
                {BILLING_COPY.balanceLabel}
              </div>
              <div className="font-display text-content flex items-center justify-end gap-1 text-lg font-bold tabular-nums">
                <DiscordiaPointIcon size={20} />
                {formatPoints(Math.max(0, state.points.balance))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === "premium" ? (
        <PremiumShowcase
          premium={state.premium}
          onManage={() => onNavigate("subscriptions")}
        />
      ) : null}

      {tab === "subscriptions" ? (
        <>
          <PremiumCard
            premium={state.premium}
            onSubscribe={() =>
              setItem({ kind: "premium", priceCents: PREMIUM_PRICE_CENTS })
            }
            onChanged={setPremium}
            onShowPlan={() => onNavigate("premium")}
          />
          <PremiumFacts />
        </>
      ) : null}

      {tab === "points" ? (
        <PointsShop
          packages={state.packages}
          onBuy={(pack) =>
            setItem({
              kind: "points",
              packageId: pack.id,
              points: pack.points,
              priceCents: pack.price_cents,
            })
          }
        />
      ) : null}

      {tab === "transactions" ? (
        <>
          <PurchaseHistory purchases={state.points.purchases} />
          <PointMovements ledger={state.points.ledger} />
        </>
      ) : null}

      {item ? (
        <CheckoutConfirmModal
          item={item}
          defaultEmail={user?.email ?? ""}
          pending={checkout.pending}
          error={checkout.error}
          onConfirm={confirmCheckout}
          onClose={closeCheckout}
        />
      ) : null}
    </div>
  );
}
