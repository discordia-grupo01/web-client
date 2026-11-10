import {
  BILLING_COPY,
  BILLING_HISTORY_PAGE_SIZE,
  formatArsFromCents,
  formatBillingDate,
  formatPoints,
  type PointPurchase,
  PURCHASE_STATUS_DESCRIPTIONS,
  PURCHASE_STATUS_LABELS,
  PURCHASE_STATUS_TONE,
  unrecoveredPointsNote,
} from "@discordia/client-shared";

import { cn } from "@/lib/cn";

import { BILLING_TONE_CLASS } from "./billingTone";
import { DiscordiaPointIcon } from "./DiscordiaIcons";
import { EmptyHistory } from "./EmptyHistory";
import { HistoryPagination } from "./HistoryPagination";
import { usePagedItems } from "./hooks/usePagedItems";

export function PurchaseHistory({ purchases }: { purchases: PointPurchase[] }) {
  const paged = usePagedItems(purchases, BILLING_HISTORY_PAGE_SIZE);

  return (
    <section>
      <div className="mb-3">
        <h4 className="font-display text-content text-base font-bold">
          {BILLING_COPY.historyTitle}
        </h4>
        <p className="text-content-subtle mt-1 text-xs">
          {BILLING_COPY.historySubtitle}
        </p>
      </div>

      {purchases.length === 0 ? (
        <EmptyHistory text={BILLING_COPY.historyEmpty} />
      ) : (
        <ul className="border-line divide-line divide-y overflow-hidden rounded-2xl border">
          {paged.pageItems.map((purchase) => (
            <li key={purchase.id} className="bg-surface-raised px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="bg-surface-input flex size-9 shrink-0 items-center justify-center rounded-xl">
                  <DiscordiaPointIcon size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-content text-sm font-semibold">
                    {formatPoints(purchase.points)}
                  </div>
                  <div className="text-content-subtle text-[11px] tabular-nums">
                    {formatArsFromCents(purchase.price_cents)} ·{" "}
                    {formatBillingDate(purchase.created_at)}
                  </div>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                    BILLING_TONE_CLASS[PURCHASE_STATUS_TONE[purchase.status]],
                  )}
                >
                  {PURCHASE_STATUS_LABELS[purchase.status]}
                </span>
              </div>
              <p className="text-content-subtle mt-1 ml-12 text-[11px]">
                {PURCHASE_STATUS_DESCRIPTIONS[purchase.status]}
              </p>
              {purchase.points_unrecovered > 0 ? (
                <p className="bg-danger/10 text-danger mt-2 rounded-lg px-3 py-2 text-[11px]">
                  {unrecoveredPointsNote(purchase.points_unrecovered)}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      <HistoryPagination
        page={paged.page}
        pageCount={paged.pageCount}
        range={paged.range}
        total={paged.total}
        noun="compras"
        onPageChange={paged.setPage}
      />
    </section>
  );
}
