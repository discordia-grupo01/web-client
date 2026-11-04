"use client";

import {
  type MessageAuthor,
  PRIVATE_CALL_BLOCKED_HINT,
  PRIVATE_CALL_START,
} from "@discordia/client-shared";

import { Phone } from "lucide-react";

import { Tooltip } from "@/components/ui/Tooltip";
import { useOptionalPrivateCall } from "@/contexts/PrivateCallContext";

interface DmCallButtonProps {
  partner: MessageAuthor;
  conversationId: string | null;
  blockedByMe: boolean;
}

export function DmCallButton({
  partner,
  conversationId,
  blockedByMe,
}: DmCallButtonProps) {
  const privateCall = useOptionalPrivateCall();
  if (!privateCall) return null;

  const isBusy = privateCall.state.phase !== "idle";
  const isDisabled = blockedByMe || !conversationId || isBusy;
  const label = blockedByMe ? PRIVATE_CALL_BLOCKED_HINT : PRIVATE_CALL_START;

  return (
    <Tooltip label={label} align="end">
      <button
        type="button"
        onClick={() => {
          if (!conversationId) return;
          privateCall.start(
            {
              id: partner.id,
              name: partner.name,
              avatarUrl: partner.avatarUrl,
            },
            conversationId,
          );
        }}
        disabled={isDisabled}
        aria-label={label}
        className="text-content-muted hover:bg-surface-hover hover:text-content cursor-pointer rounded-md p-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Phone size={18} />
      </button>
    </Tooltip>
  );
}
