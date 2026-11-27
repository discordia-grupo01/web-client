"use client";

import { useIsOnline } from "@/components/connection/hooks/useIsOnline";
import { LogoLoader } from "@/components/ui/LogoLoader";

export function OfflineScreen() {
  const isOnline = useIsOnline();
  if (isOnline) return null;

  return (
    <div
      role="alert"
      className="bg-surface fixed inset-0 z-[1000] flex flex-col items-center justify-center gap-6 px-4"
    >
      <LogoLoader />
      <div className="text-center">
        <p className="font-display text-content text-lg font-semibold">
          Sin conexión
        </p>
        <p className="text-content-muted text-sm">Reintentando…</p>
      </div>
    </div>
  );
}
