import {
  HIDE_STATUS_NOTICE_LABEL,
  type Incident,
  type PlatformStatus,
  statusNoticeText,
  VIEW_PLATFORM_STATUS_LABEL,
} from "@discordia/client-shared";
import { ChevronRight, X } from "lucide-react";

import { cn } from "@/lib/cn";

import { STATUS_TONES } from "./utils/statusTone";

interface PlatformStatusBannerProps {
  status: PlatformStatus;
  incidents: readonly Incident[];
  onOpenDetails: () => void;
  onHide: () => void;
}

export function PlatformStatusBanner({
  status,
  incidents,
  onOpenDetails,
  onHide,
}: PlatformStatusBannerProps) {
  const tone = STATUS_TONES[status];
  const Icon = tone.icon;

  return (
    <div
      role="status"
      className={cn(
        "flex min-h-10 shrink-0 items-center gap-2 py-1.5 pr-1.5 pl-3 text-black/85 sm:pl-4",
        tone.bar,
      )}
    >
      <button
        type="button"
        onClick={onOpenDetails}
        className="group flex min-w-0 flex-1 cursor-pointer items-center justify-center gap-2 text-sm"
      >
        <Icon size={16} className="shrink-0" aria-hidden />
        <span className="truncate font-semibold">
          {statusNoticeText(incidents)}
        </span>
        <span className="hidden shrink-0 items-center gap-0.5 font-medium underline decoration-black/30 underline-offset-4 group-hover:decoration-black/80 sm:inline-flex">
          {VIEW_PLATFORM_STATUS_LABEL}
          <ChevronRight size={14} aria-hidden />
        </span>
      </button>
      <button
        type="button"
        onClick={onHide}
        aria-label={HIDE_STATUS_NOTICE_LABEL}
        className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-black/10"
      >
        <X size={15} aria-hidden />
      </button>
    </div>
  );
}
