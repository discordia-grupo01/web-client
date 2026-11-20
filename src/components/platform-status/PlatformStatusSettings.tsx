"use client";

import { FormAlert } from "@/components/ui/FormAlert";
import { SettingsSection } from "@/components/ui/settings/SettingsSection";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

import { usePlatformStatus } from "./hooks/usePlatformStatus";
import { PlatformStatusDetails } from "./PlatformStatusDetails";

export function PlatformStatusSettings() {
  const { state } = usePlatformStatus();

  return (
    <SettingsSection>
      {state.phase === "loading" ? (
        <LoadingSpinner label="Cargando estado" />
      ) : state.phase === "error" ? (
        <FormAlert message={state.message} />
      ) : (
        <PlatformStatusDetails {...state.data} />
      )}
    </SettingsSection>
  );
}
