import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export const EMPTY_STATE_ICON_SIZE = 27;

type SettingsEmptyStateProps = { text: string } & (
  { icon: LucideIcon; media?: never } | { icon?: never; media: ReactNode }
);

export function SettingsEmptyState({
  icon: Icon,
  media,
  text,
}: SettingsEmptyStateProps) {
  return (
    <div className="border-line-strong bg-surface-raised text-content-subtle flex flex-col items-center gap-3 rounded-2xl border border-dashed px-5 py-8 text-center">
      {media ??
        (Icon ? <Icon size={EMPTY_STATE_ICON_SIZE} aria-hidden /> : null)}
      <p className="text-content-muted text-sm font-semibold">{text}</p>
    </div>
  );
}
