"use client";

import {
  BILLING_SECTION_TITLE,
  formatPoints,
  PREMIUM_PRICE_CENTS,
} from "@discordia/client-shared";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { FormAlert } from "@/components/ui/FormAlert";
import { useAuth } from "@/contexts/AuthContext";

import { BILLING_COPY } from "./billingCopy";
import {
  CheckoutConfirmModal,
  type CheckoutItem,
} from "./CheckoutConfirmModal";
import { useBillingOverview } from "./hooks/useBillingOverview";
import { useCheckout } from "./hooks/useCheckout";
import { PointMovements } from "./PointMovements";
import { PointsShop } from "./PointsShop";
import { PremiumCard } from "./PremiumCard";
import { PurchaseHistory } from "./PurchaseHistory";

/** Sección "Premium y puntos" de la configuración de cuenta. */
export function BillingSettings() {
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="text-content font-display text-xl font-bold">
          {BILLING_SECTION_TITLE}
        </h3>
        <div className="border-line bg-surface-raised rounded-xl border px-3 py-2 text-right">
          <div className="text-content-subtle text-[10px] font-bold tracking-wider uppercase">
            {BILLING_COPY.balanceLabel}
          </div>
          <div className="font-display text-content text-lg font-bold">
            {formatPoints(state.points.balance)}
          </div>
        </div>
      </div>

      <PremiumCard
        premium={state.premium}
        onSubscribe={() =>
          setItem({ kind: "premium", priceCents: PREMIUM_PRICE_CENTS })
        }
        onChanged={setPremium}
      />

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

      <PurchaseHistory purchases={state.points.purchases} />
      <PointMovements ledger={state.points.ledger} />

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
