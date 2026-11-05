import {
  formatPointsDelta,
  LEDGER_REASON_LABELS,
  type LedgerEntry,
} from "@discordia/client-shared";

import { cn } from "@/lib/cn";

import { BILLING_COPY } from "./billingCopy";
import { formatBillingDate } from "./formatBillingDate";

export function PointMovements({ ledger }: { ledger: LedgerEntry[] }) {
  return (
    <section className="space-y-3">
      <h4 className="font-display text-content text-base font-bold">
        {BILLING_COPY.movementsTitle}
      </h4>

      {ledger.length === 0 ? (
        <p className="text-content-muted text-sm">
          {BILLING_COPY.movementsEmpty}
        </p>
      ) : (
        <ul className="border-line divide-line divide-y overflow-hidden rounded-2xl border">
          {ledger.map((entry, index) => (
            <li
              key={`${entry.created_at}-${index}`}
              className="bg-surface-raised flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <div className="text-content text-sm font-medium">
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
    </section>
  );
}
