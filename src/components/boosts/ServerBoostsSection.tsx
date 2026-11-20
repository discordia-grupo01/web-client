"use client";

import {
  BOOST_SECTION_TAB_LABELS,
  BOOST_SECTION_TABS,
  type BoostSectionTab,
  BOOSTS_SECTION_DESCRIPTION,
  BOOSTS_SECTION_TITLE,
  RETRY_LABEL,
  type ServerSummary,
} from "@discordia/client-shared";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { FormAlert } from "@/components/ui/FormAlert";
import { SegmentedTabs } from "@/components/ui/SegmentedTabs";
import { SettingsSection } from "@/components/ui/settings/SettingsSection";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

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
  initialTab?: BoostSectionTab;
  onBuyPoints: () => void;
}

export function ServerBoostsSection({
  server,
  initialTab = "boost",
  onBuyPoints,
}: ServerBoostsSectionProps) {
  const { summary, loadError, retry } = useServerBoostSummary(server.id);
  const [tab, setTab] = useState<BoostSectionTab>(initialTab);

  return (
    <SettingsSection
      description={BOOSTS_SECTION_DESCRIPTION}
      toolbar={
        <SegmentedTabs
          tabs={TABS}
          value={tab}
          onChange={setTab}
          label={BOOSTS_SECTION_TITLE}
        />
      }
    >
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
        <LoadingSpinner />
      )}
    </SettingsSection>
  );
}
