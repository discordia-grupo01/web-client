import { BOOST_SERVER_LABEL } from "@discordia/client-shared";

import { BoostActionIcon } from "./BoostActionIcon";

interface BoostServerButtonProps {
  onClick: () => void;
}

export function BoostServerButton({ onClick }: BoostServerButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-display bg-accent text-on-accent focus-visible:ring-accent inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl py-1.5 pr-3 pl-1.5 text-xs font-bold whitespace-nowrap transition-all hover:brightness-110 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.97]"
    >
      <span className="bg-surface-modal flex size-6 items-center justify-center rounded-lg">
        <BoostActionIcon size={18} />
      </span>
      {BOOST_SERVER_LABEL}
    </button>
  );
}
