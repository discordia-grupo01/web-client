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
      className="bg-surface-servers border-status-bar-edge text-on-accent flex min-h-10 shrink-0 items-center gap-2 border-b py-1.5 pr-1.5 pl-3 sm:pl-4"
    >
      <button
        type="button"
        onClick={onOpenDetails}
        className="group flex min-w-0 flex-1 cursor-pointer items-center justify-center gap-2 text-sm"
      >
        <Icon size={16} className={cn("shrink-0", tone.ink)} aria-hidden />
        <span className="truncate font-semibold">
          {statusNoticeText(incidents)}
        </span>
        <span className="text-on-accent/70 decoration-on-accent/40 group-hover:text-on-accent group-hover:decoration-on-accent hidden shrink-0 items-center gap-0.5 font-medium underline underline-offset-4 sm:inline-flex">
          {VIEW_PLATFORM_STATUS_LABEL}
          <ChevronRight size={14} aria-hidden />
        </span>
      </button>
      <button
        type="button"
        onClick={onHide}
        aria-label={HIDE_STATUS_NOTICE_LABEL}
        className="text-on-accent/70 hover:bg-on-accent/10 hover:text-on-accent flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors"
      >
        <X size={15} aria-hidden />
      </button>
    </div>
  );
}
