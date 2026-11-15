import {
  BOOST_STATUS_LABELS,
  BOOST_STATUS_TONE,
  type BoostStatus,
} from "@discordia/client-shared";

import { BILLING_TONE_CLASS } from "@/components/billing/billingTone";
import { cn } from "@/lib/cn";

export function BoostStatusChip({ status }: { status: BoostStatus }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        BILLING_TONE_CLASS[BOOST_STATUS_TONE[status]],
      )}
    >
      {BOOST_STATUS_LABELS[status]}
    </span>
  );
}
