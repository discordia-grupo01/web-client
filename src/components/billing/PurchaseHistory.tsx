import {
  formatArsFromCents,
  formatPoints,
  type PointPurchase,
  PURCHASE_STATUS_DESCRIPTIONS,
  PURCHASE_STATUS_LABELS,
  type PurchaseStatus,
  unrecoveredPointsNote,
} from "@discordia/client-shared";

import { Zap } from "lucide-react";

import { cn } from "@/lib/cn";

import { BILLING_COPY } from "./billingCopy";
import { formatBillingDate } from "./formatBillingDate";

const STATUS_TONE: Record<PurchaseStatus, string> = {
  pending: "bg-warning/20 text-content",
  paid: "bg-success/15 text-success",
  failed: "bg-danger/15 text-danger",
  expired: "bg-surface-input text-content-muted",
  refunded: "bg-info/15 text-info",
  charged_back: "bg-danger/15 text-danger",
};

export function PurchaseHistory({ purchases }: { purchases: PointPurchase[] }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-display text-content text-base font-bold">
          {BILLING_COPY.historyTitle}
        </h4>
        <span className="text-content-subtle text-xs">{purchases.length}</span>
      </div>

      {purchases.length === 0 ? (
        <p className="border-line-strong bg-surface-raised text-content-muted rounded-2xl border border-dashed px-5 py-8 text-center text-sm">
          {BILLING_COPY.historyEmpty}
        </p>
      ) : (
        <ul className="border-line divide-line divide-y overflow-hidden rounded-2xl border">
          {purchases.map((purchase) => (
            <li
              key={purchase.id}
              className="bg-surface-raised flex flex-wrap items-center gap-3 px-4 py-3"
            >
              <div className="bg-surface-input text-highlight flex size-9 shrink-0 items-center justify-center rounded-xl">
                <Zap size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-display text-content text-sm font-semibold">
                  {formatPoints(purchase.points)}
                </div>
                <div className="text-content-subtle text-[11px]">
                  {formatBillingDate(purchase.created_at)} ·{" "}
                  {PURCHASE_STATUS_DESCRIPTIONS[purchase.status]}
                </div>
                {purchase.points_unrecovered > 0 ? (
                  <div className="text-danger mt-0.5 text-[11px]">
                    {unrecoveredPointsNote(purchase.points_unrecovered)}
                  </div>
                ) : null}
              </div>
              <div className="text-right">
                <div className="text-content-muted mb-1 text-xs font-semibold">
                  {formatArsFromCents(purchase.price_cents)}
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-1 text-[10px] font-bold tracking-wide uppercase",
                    STATUS_TONE[purchase.status],
                  )}
                >
                  {PURCHASE_STATUS_LABELS[purchase.status]}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
