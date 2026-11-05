import { DiscordiaPremiumBadge } from "./DiscordiaIcons";

export function PremiumPill() {
  return (
    <span
      title="Plan Premium activo"
      className="inline-flex items-center gap-1 rounded-full border border-[#F0B232]/30 bg-[#F0B232]/10 px-2 py-1 text-[10px] font-bold tracking-wide text-[#F0B232] uppercase"
    >
      <DiscordiaPremiumBadge size={14} />
      Premium
    </span>
  );
}
