"use client";

import {
  FOCUSED_MESSAGE_HIGHLIGHT_MS,
  type FocusedMessage,
} from "@discordia/client-shared";
import { useEffect, useState } from "react";

export function useMessageHighlight(
  focusedMessage: FocusedMessage | null,
): string | null {
  const [expiredNonce, setExpiredNonce] = useState<number | null>(null);
  const focusNonce = focusedMessage?.nonce;

  useEffect(() => {
    if (focusNonce === undefined) return;
    const timer = setTimeout(
      () => setExpiredNonce(focusNonce),
      FOCUSED_MESSAGE_HIGHLIGHT_MS,
    );
    return () => clearTimeout(timer);
  }, [focusNonce]);

  return focusedMessage && focusedMessage.nonce !== expiredNonce
    ? focusedMessage.id
    : null;
}
