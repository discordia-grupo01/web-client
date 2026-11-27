"use client";

import { useState } from "react";

export function SettingsToast({ message }: { message: string | null }) {
  const [lastMessage, setLastMessage] = useState(message);
  if (message && message !== lastMessage) setLastMessage(message);

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-surface-raised border-line-strong pointer-events-none absolute left-1/2 z-[999] flex w-max max-w-[min(32rem,calc(100%-2rem))] min-w-[200px] -translate-x-1/2 items-center gap-2.5 rounded-xl border px-4 py-2.5 shadow-xl transition-all duration-300"
      style={{ bottom: message ? 20 : -60, opacity: message ? 1 : 0 }}
    >
      <span className="bg-accent size-2 shrink-0 rounded-full" />
      <p className="text-content font-display text-sm font-semibold">
        {lastMessage}
      </p>
    </div>
  );
}
