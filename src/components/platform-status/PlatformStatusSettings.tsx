"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/Button";

import { usePlatformStatus } from "./hooks/usePlatformStatus";
import { PlatformStatusDetails } from "./PlatformStatusDetails";

export function PlatformStatusSettings() {
  const { state, retry } = usePlatformStatus();

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
      <div
        role="alert"
        className="border-line-strong text-content-muted flex flex-col items-center gap-3 rounded-2xl border border-dashed px-4 py-10 text-center"
      >
        <AlertTriangle size={28} aria-hidden />
        <p className="text-sm">{state.message}</p>
        <Button
          type="button"
          variant="secondary"
          className="w-auto px-4"
          onClick={retry}
        >
          Reintentar
        </Button>
      </div>
    );
  }

  return <PlatformStatusDetails {...state.data} />;
}
