"use client";

import { PhoneOff, X } from "lucide-react";
import { useEffect } from "react";

import { useOptionalPrivateCall } from "@/contexts/PrivateCallContext";

const AUTO_DISMISS_MS = 6_000;

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

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex justify-center px-4">
      <div
        role="status"
        className="bg-surface-raised border-line-strong text-content pointer-events-auto flex max-w-md items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg"
      >
        <PhoneOff size={16} className="text-danger shrink-0" />
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
