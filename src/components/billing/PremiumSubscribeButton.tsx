import { DiscordiaPremiumIcon } from "./DiscordiaIcons";

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
      className="font-display flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#F0B232] px-5 py-3 text-sm font-bold text-[#1C293B] shadow-[0_6px_20px_rgba(240,178,50,0.3)] transition-[filter,transform] hover:brightness-105 active:scale-[0.98]"
    >
      <span className="flex size-6 items-center justify-center rounded-md bg-[#1C293B]">
        <DiscordiaPremiumIcon size={16} />
      </span>
      {label}
    </button>
  );
}
