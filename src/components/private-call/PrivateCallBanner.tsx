"use client";

import {
  PRIVATE_CALL_HANG_UP,
  privateCallTitle,
} from "@discordia/client-shared";

import { Maximize2, PhoneOff } from "lucide-react";

import { CallDuration } from "@/components/voice/CallDuration";
import { useOptionalPrivateCall } from "@/contexts/PrivateCallContext";

const BACK_TO_CALL = "Volver a la llamada";

export function PrivateCallBanner() {
  const privateCall = useOptionalPrivateCall();
  if (!privateCall?.isMinimized) return null;
  const { phase, partner } = privateCall.state;
  if (!partner || (phase !== "connecting" && phase !== "in_call")) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-4">
      <div
        role="status"
        className="bg-surface-raised border-success/30 pointer-events-auto flex items-center gap-1 rounded-full border py-1 pr-1 pl-3 shadow-lg"
      >
        <button
          type="button"
          onClick={privateCall.restore}
          aria-label={BACK_TO_CALL}
          title={BACK_TO_CALL}
          className="hover:bg-success/10 flex min-w-0 cursor-pointer items-center gap-2 rounded-full py-1 pr-2 transition-colors"
        >
          <span
            aria-hidden
            className="bg-success size-2 shrink-0 animate-pulse rounded-full"
          />
          <span className="font-display text-content truncate text-sm font-semibold">
            {privateCallTitle(partner.name)}
          </span>
          {privateCall.connectedAt !== null ? (
            <CallDuration
              startedAt={privateCall.connectedAt}
              className="text-success text-xs"
            />
          ) : null}
          <Maximize2 size={14} className="text-content-subtle shrink-0" />
        </button>
        <button
          type="button"
          onClick={privateCall.hangUp}
          aria-label={PRIVATE_CALL_HANG_UP}
          title={PRIVATE_CALL_HANG_UP}
          className="bg-danger/15 text-danger hover:bg-danger/25 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors"
        >
          <PhoneOff size={15} />
        </button>
      </div>
    </div>
  );
}
