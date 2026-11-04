"use client";

import type { PrivateCallEndReason } from "@discordia/client-shared";

import {
  type LucideIcon,
  Phone,
  PhoneMissed,
  PhoneOff,
  TriangleAlert,
  WifiOff,
  X,
} from "lucide-react";
import { useEffect } from "react";

import { useOptionalPrivateCall } from "@/contexts/PrivateCallContext";
import { cn } from "@/lib/cn";

const AUTO_DISMISS_MS = 6_000;

const ICONS: Record<PrivateCallEndReason, { icon: LucideIcon; color: string }> =
  {
    declined: { icon: PhoneOff, color: "text-danger" },
    cancelled: { icon: PhoneMissed, color: "text-danger" },
    missed: { icon: PhoneMissed, color: "text-danger" },
    hangup: { icon: Phone, color: "text-content-muted" },
    disconnected: { icon: WifiOff, color: "text-highlight" },
  };
const ERROR_ICON = { icon: TriangleAlert, color: "text-highlight" };

export function PrivateCallNotice() {
  const privateCall = useOptionalPrivateCall();
  const notice =
    privateCall?.state.phase === "idle" ? privateCall.state.notice : null;
  const dismiss = privateCall?.dismissNotice;

  useEffect(() => {
    if (!notice || !dismiss) return;
    const timer = window.setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [notice, dismiss]);

  if (!notice || !dismiss) return null;
  const { icon: Icon, color } = privateCall?.endReason
    ? ICONS[privateCall.endReason]
    : ERROR_ICON;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex justify-center px-4">
      <div
        role="status"
        className="bg-surface-raised border-line-strong text-content pointer-events-auto flex max-w-md items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg"
      >
        <Icon size={16} className={cn("shrink-0", color)} />
        <span className="flex-1">{notice}</span>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Cerrar aviso"
          className="text-content-subtle hover:text-content cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
