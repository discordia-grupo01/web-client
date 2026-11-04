import {
  PLATFORM_STATUS_TITLE,
  type PlatformStatusResponse,
} from "@discordia/client-shared";

import { ModalShell } from "@/components/ui/ModalShell";

import { PlatformStatusDetails } from "./PlatformStatusDetails";

interface PlatformStatusModalProps {
  data: PlatformStatusResponse;
  onClose: () => void;
}

export function PlatformStatusModal({
  data,
  onClose,
}: PlatformStatusModalProps) {
  return (
    <ModalShell
      onClose={onClose}
      labelledBy="platform-status-title"
      maxWidth={640}
      isFullScreenOnMobile
    >
      <header className="border-line shrink-0 border-b px-5 py-4 pr-14 sm:px-6">
        <h2
          id="platform-status-title"
          className="text-content font-display text-lg font-bold"
        >
          {PLATFORM_STATUS_TITLE}
        </h2>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
        <PlatformStatusDetails {...data} />
      </div>
    </ModalShell>
  );
}
