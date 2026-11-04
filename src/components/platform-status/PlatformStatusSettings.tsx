"use client";

import { FormAlert } from "@/components/ui/FormAlert";

import { usePlatformStatus } from "./hooks/usePlatformStatus";
import { PlatformStatusDetails } from "./PlatformStatusDetails";

export function PlatformStatusSettings() {
  const { state } = usePlatformStatus();

  if (state.phase === "loading") {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Cargando estado">
        <div className="bg-surface-raised h-20 animate-pulse rounded-2xl" />
        <div className="bg-surface-raised h-32 animate-pulse rounded-2xl" />
      </div>
    );
  }

  if (state.phase === "error") {
    return (
      <div className="mx-auto max-w-2xl">
        <FormAlert message={state.message} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PlatformStatusDetails {...state.data} />
    </div>
  );
}
