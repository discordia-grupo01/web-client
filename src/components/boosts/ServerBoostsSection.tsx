"use client";

import {
  BOOSTS_SECTION_DESCRIPTION,
  BOOSTS_SECTION_TITLE,
  RETRY_LABEL,
  type ServerSummary,
} from "@discordia/client-shared";

import { Button } from "@/components/ui/Button";
import { FormAlert } from "@/components/ui/FormAlert";

import { BoostPerksTable } from "./BoostPerksTable";
import { BoostShowcase } from "./BoostShowcase";
import { BoostStatusCard } from "./BoostStatusCard";
import { useServerBoostSummary } from "./hooks/useServerBoostSummary";

interface ServerBoostsSectionProps {
  server: ServerSummary;
  titleId: string;
}

export function ServerBoostsSection({
  server,
  titleId,
}: ServerBoostsSectionProps) {
  const { summary, loadError, retry } = useServerBoostSummary(server.id);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 px-4 pt-6 pb-2 sm:px-7 sm:pt-8 sm:pr-16">
        <h2
          id={titleId}
          className="font-display text-content mb-1 text-xl font-bold"
        >
          {BOOSTS_SECTION_TITLE}
        </h2>
        <p className="text-content-muted text-sm leading-relaxed">
          {BOOSTS_SECTION_DESCRIPTION}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-5 pb-6 sm:mr-1.5 sm:mb-2 sm:pr-5.5 sm:pl-7">
        {summary ? (
          <div className="space-y-7">
            <BoostStatusCard summary={summary} />
            <BoostPerksTable level={summary.level} />
            <BoostShowcase server={server} summary={summary} />
          </div>
        ) : loadError ? (
          <div className="space-y-3">
            <FormAlert message={loadError} />
            <Button
              type="button"
              variant="secondary"
              onClick={() => void retry()}
            >
              {RETRY_LABEL}
            </Button>
          </div>
        ) : (
          <p className="text-content-subtle text-sm">Cargando…</p>
        )}
      </div>
    </div>
  );
}
