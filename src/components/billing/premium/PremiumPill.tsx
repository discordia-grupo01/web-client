import { BILLING_COPY } from "@discordia/client-shared";

import { DiscordiaPremiumBadge } from "../icons/DiscordiaIcons";

export function PremiumPill() {
  return (
    <span
      title={BILLING_COPY.premiumPillLabel}
      className="border-amber/30 bg-amber/10 text-amber inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-bold tracking-wide uppercase"
    >
      <DiscordiaPremiumBadge size={14} />
      {BILLING_COPY.premiumPill}
    </span>
  );
}
