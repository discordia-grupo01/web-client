"use client";

import {
  BOOST_SECTION_TAB_LABELS,
  BOOST_SECTION_TABS,
  type BoostSectionTab,
  BOOSTS_SECTION_DESCRIPTION,
  BOOSTS_SECTION_TITLE,
  boostsSectionTitleFor,
  RETRY_LABEL,
  type ServerSummary,
} from "@discordia/client-shared";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { FormAlert } from "@/components/ui/FormAlert";
import { SegmentedTabs } from "@/components/ui/SegmentedTabs";

import { BoostPerksTable } from "./benefits/BoostPerksTable";
import { BoostShowcase } from "./benefits/BoostShowcase";
import { useServerBoostSummary } from "./hooks/useServerBoostSummary";
import { ServerBoostTab } from "./ServerBoostTab";

const TABS = BOOST_SECTION_TABS.map((value) => ({
  value,
  label: BOOST_SECTION_TAB_LABELS[value],
}));

interface ServerBoostsSectionProps {
  server: ServerSummary;
  titleId: string;
  onBuyPoints: () => void;
}

export function ServerBoostsSection({
  server,
  titleId,
  onBuyPoints,
}: ServerBoostsSectionProps) {
  const { summary, loadError, retry } = useServerBoostSummary(server.id);
  const [tab, setTab] = useState<BoostSectionTab>("boost");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 px-4 pt-6 sm:px-7 sm:pt-8 sm:pr-16">
        <h2
          id={titleId}
          className="font-display text-content mb-1 text-xl font-bold break-words"
        >
          {boostsSectionTitleFor(server.name)}
        </h2>
        <p className="text-content-muted text-sm leading-relaxed">
          {BOOSTS_SECTION_DESCRIPTION}
        </p>
      </div>
      {/* Fuera del encabezado, que deja lugar a la X: así ocupa el mismo ancho que el contenido. */}
      <div className="shrink-0 px-4 pt-4 pb-2 sm:px-7">
        <SegmentedTabs
          tabs={TABS}
          value={tab}
          onChange={setTab}
          label={BOOSTS_SECTION_TITLE}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-5 pb-6 sm:mr-1.5 sm:mb-2 sm:pr-5.5 sm:pl-7">
        {summary && tab === "boost" ? (
          <ServerBoostTab
            server={server}
            summary={summary}
            onSummaryStale={retry}
            onBuyPoints={onBuyPoints}
          />
        ) : summary ? (
          <div className="space-y-7">
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
