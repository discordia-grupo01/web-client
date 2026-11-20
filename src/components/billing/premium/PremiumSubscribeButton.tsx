import { DiscordiaPremiumIcon } from "../icons/DiscordiaIcons";

interface PremiumSubscribeButtonProps {
  label: string;
  onClick: () => void;
}

export function PremiumSubscribeButton({
  label,
  onClick,
}: PremiumSubscribeButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-display bg-amber text-boost-ink flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold shadow-[0_6px_20px_color-mix(in_srgb,var(--amber)_30%,transparent)] transition-[filter,transform] hover:brightness-105 active:scale-[0.98]"
    >
      <span className="bg-boost-ink flex size-6 items-center justify-center rounded-md">
        <DiscordiaPremiumIcon size={16} />
      </span>
      {label}
    </button>
  );
}
