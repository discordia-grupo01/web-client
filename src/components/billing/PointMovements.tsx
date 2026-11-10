import {
  BILLING_COPY,
  BILLING_HISTORY_PAGE_SIZE,
  formatBillingDate,
  formatPointsDelta,
  LEDGER_REASON_LABELS,
  type LedgerEntry,
} from "@discordia/client-shared";

import { cn } from "@/lib/cn";

import { DiscordiaPointIcon } from "./DiscordiaIcons";
import { EmptyHistory } from "./EmptyHistory";
import { HistoryPagination } from "./HistoryPagination";
import { usePagedItems } from "./hooks/usePagedItems";

export function PointMovements({ ledger }: { ledger: LedgerEntry[] }) {
  const paged = usePagedItems(ledger, BILLING_HISTORY_PAGE_SIZE);

  return (
    <section>
      <div className="mb-3">
        <h4 className="font-display text-content text-base font-bold">
          {BILLING_COPY.movementsTitle}
        </h4>
        <p className="text-content-subtle mt-1 text-xs">
          {BILLING_COPY.movementsSubtitle}
        </p>
      </div>

      {ledger.length === 0 ? (
        <EmptyHistory text={BILLING_COPY.movementsEmpty} />
      ) : (
        <ul className="border-line divide-line divide-y overflow-hidden rounded-2xl border">
          {paged.pageItems.map((entry, index) => (
            <li
              key={`${entry.created_at}-${index}`}
              className="bg-surface-raised flex items-center gap-3 px-4 py-3"
            >
              <DiscordiaPointIcon size={18} className="shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="font-display text-content text-sm font-semibold">
                  {LEDGER_REASON_LABELS[entry.reason]}
                </div>
                <div className="text-content-subtle text-[11px]">
                  {formatBillingDate(entry.created_at)}
                </div>
              </div>
              <span
                className={cn(
                  "font-display text-sm font-bold tabular-nums",
                  entry.delta >= 0 ? "text-success" : "text-danger",
                )}
              >
                {formatPointsDelta(entry.delta)}
              </span>
            </li>
          ))}
        </ul>
      )}
      <HistoryPagination
        page={paged.page}
        pageCount={paged.pageCount}
        range={paged.range}
        total={paged.total}
        noun="movimientos"
        onPageChange={paged.setPage}
      />
    </section>
  );
}
