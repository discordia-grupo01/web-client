"use client";

import {
  BILLING_BOOSTS_COPY,
  BOOST_ACTION_COPY,
  BOOST_TIER_SUMMARIES,
  type BoostedServer,
  boostedServersCountLabel,
  boostedServerSummaryLabel,
  hasBoostedBadge,
  RETRY_LABEL,
  serverBoostCount,
  serverBoostLevel,
  type ServerSummary,
} from "@discordia/client-shared";

import { BoostedBadge } from "@/components/boosts/icons/BoostedBadge";
import { BoostLevelIcon } from "@/components/boosts/icons/BoostLevelIcon";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { FormAlert } from "@/components/ui/FormAlert";
import { cn } from "@/lib/cn";
import { serverIconSrc } from "@/utils/image-urls";
import { requestServerBoosts } from "@/utils/serverBoostsRequest";

import { EmptyHistory } from "../history/EmptyHistory";
import { HistoryPagination } from "../history/HistoryPagination";
import { useBoostedServersPage } from "../hooks/useBoostedServersPage";
import { useServerDirectory } from "../hooks/useServerDirectory";

function HowBoostsWork({ onBuyPoints }: { onBuyPoints: () => void }) {
  return (
    <section className="border-line bg-surface-raised rounded-2xl border p-5">
      <h4 className="font-display text-content text-base font-bold">
        {BILLING_BOOSTS_COPY.howTitle}
      </h4>
      <p className="text-content-muted mt-1 text-sm leading-relaxed">
        {BILLING_BOOSTS_COPY.howDescription}
      </p>
      <ul className="mt-4 space-y-2">
        {BOOST_TIER_SUMMARIES.map((tier) => (
          <li
            key={tier.level}
            className="bg-surface-input flex items-center gap-3 rounded-xl px-3 py-2.5"
          >
            <BoostLevelIcon level={tier.level} size={22} bare />
            <span className="min-w-0">
              <strong className="font-display text-content block text-sm">
                {tier.label}
              </strong>
              <small className="text-content-muted block">{tier.perks}</small>
            </span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onBuyPoints}
        className="text-accent-strong mt-4 cursor-pointer text-sm font-semibold hover:underline"
      >
        {BOOST_ACTION_COPY.buyPoints}
      </button>
    </section>
  );
}

interface BoostedServerRowProps {
  boosted: BoostedServer;
  server: ServerSummary | undefined;
}

function BoostedServerRow({ boosted, server }: BoostedServerRowProps) {
  const level = server ? serverBoostLevel(server) : 0;
  const isBoosted = hasBoostedBadge(level);
  const standing = server
    ? { level, boostCount: serverBoostCount(server) }
    : null;

  return (
    <li className="bg-surface-raised flex items-center gap-3 px-4 py-3">
      <Avatar
        name={server?.name ?? "?"}
        src={server ? serverIconSrc(server) : undefined}
        size={40}
        className={cn(
          "rounded-xl",
          isBoosted &&
            "ring-boost-yellow ring-offset-surface-raised ring-2 ring-offset-2",
        )}
      />
      <div className="min-w-0 flex-1">
        <p className="flex min-w-0 items-center gap-1.5">
          <span
            className={cn(
              "font-display truncate text-sm font-bold",
              server ? "text-content" : "text-content-muted",
            )}
          >
            {server?.name ?? BILLING_BOOSTS_COPY.unknownServer}
          </span>
          {isBoosted ? <BoostedBadge size={16} /> : null}
        </p>
        <p className="text-content-subtle mt-0.5 flex items-center gap-1.5 text-xs">
          {server ? (
            <BoostLevelIcon level={level} size={14} bare tight />
          ) : null}
          {boostedServerSummaryLabel(boosted, standing)}
        </p>
      </div>
      {server ? (
        <button
          type="button"
          onClick={() => requestServerBoosts(boosted.server_id)}
          className="bg-surface-input text-content-muted hover:text-content shrink-0 cursor-pointer rounded-xl px-4 py-2 text-xs font-semibold transition-colors"
        >
          {BILLING_BOOSTS_COPY.manage}
        </button>
      ) : null}
    </li>
  );
}

interface BoostsTabProps {
  onBuyPoints: () => void;
}

export function BoostsTab({ onBuyPoints }: BoostsTabProps) {
  const boosted = useBoostedServersPage();
  const servers = useServerDirectory();
  const rows = boosted.data?.servers ?? [];

  return (
    <>
      <HowBoostsWork onBuyPoints={onBuyPoints} />

      <section>
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h4 className="font-display text-content text-base font-bold">
            {BILLING_BOOSTS_COPY.yourBoostsTitle}
          </h4>
          {boosted.total > 0 ? (
            <span className="text-content-subtle text-xs font-semibold">
              {boostedServersCountLabel(boosted.total)}
            </span>
          ) : null}
        </div>
        {boosted.loadError && boosted.data === null ? (
          <div className="space-y-3">
            <FormAlert message={boosted.loadError} />
            <Button
              type="button"
              variant="secondary"
              onClick={() => void boosted.reload()}
            >
              {RETRY_LABEL}
            </Button>
          </div>
        ) : boosted.data === null || servers === null ? (
          <p className="text-content-subtle text-sm">Cargando…</p>
        ) : rows.length === 0 ? (
          <EmptyHistory text={BILLING_BOOSTS_COPY.empty} />
        ) : (
          <>
            <ul className="border-line divide-line divide-y overflow-hidden rounded-2xl border">
              {rows.map((row) => (
                <BoostedServerRow
                  key={row.server_id}
                  boosted={row}
                  server={servers.get(row.server_id)}
                />
              ))}
            </ul>
            <HistoryPagination
              page={boosted.page}
              pageCount={boosted.pageCount}
              range={boosted.range}
              total={boosted.total}
              noun={BILLING_BOOSTS_COPY.paginationNoun}
              onPageChange={boosted.setPage}
            />
            <p className="text-content-subtle mt-2 text-xs">
              {BILLING_BOOSTS_COPY.footnote}
            </p>
          </>
        )}
      </section>
    </>
  );
}
