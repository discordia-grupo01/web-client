import {
  activeBoostsLabel,
  BOOST_LIST_COPY,
  type Boost,
  boostRowMeta,
} from "@discordia/client-shared";

import { EmptyHistory } from "@/components/billing/history/EmptyHistory";
import { HistoryPagination } from "@/components/billing/history/HistoryPagination";
import { FormAlert } from "@/components/ui/FormAlert";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { cn } from "@/lib/cn";

import type { ServerBoostsPage } from "../hooks/useServerBoostsPage";
import { BoostActionIcon } from "../icons/BoostActionIcon";
import { BoostStatusChip } from "./BoostStatusChip";

interface BoostRowsProps {
  boosts: Boost[];
  onRemove: (boost: Boost) => void;
}

export function BoostRows({ boosts, onRemove }: BoostRowsProps) {
  return (
    <ul className="border-line divide-line divide-y overflow-hidden rounded-2xl border">
      {boosts.map((boost) => (
        <li
          key={boost.id}
          className="bg-surface-raised flex items-center gap-3 px-4 py-3"
        >
          <span
            className={cn(
              "bg-surface-input flex size-9 shrink-0 items-center justify-center rounded-xl",
              boost.status !== "active" && "opacity-45",
            )}
          >
            <BoostActionIcon size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <BoostStatusChip status={boost.status} />
            <p className="text-content-subtle mt-1 text-xs">
              {boostRowMeta(boost)}
            </p>
          </div>
          {boost.status === "active" ? (
            <button
              type="button"
              onClick={() => onRemove(boost)}
              className="bg-danger-soft text-danger shrink-0 cursor-pointer rounded-xl px-4 py-2 text-xs font-semibold transition-colors hover:brightness-110"
            >
              {BOOST_LIST_COPY.remove}
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

interface ServerBoostListProps {
  list: ServerBoostsPage;
  onRemove: (boost: Boost) => void;
}

export function ServerBoostList({ list, onRemove }: ServerBoostListProps) {
  const active = list.data?.active ?? 0;
  const boosts = list.data?.boosts ?? [];

  return (
    <section aria-labelledby="server-boost-list-title">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3
          id="server-boost-list-title"
          className="font-display text-content text-base font-bold"
        >
          {BOOST_LIST_COPY.title}
        </h3>
        {active > 0 ? (
          <span className="text-content-subtle text-xs font-semibold">
            {activeBoostsLabel(active)}
          </span>
        ) : null}
      </div>
      {list.loadError ? (
        <div className="mb-3">
          <FormAlert message={list.loadError} />
        </div>
      ) : null}
      {list.data === null ? (
        list.loadError ? null : (
          <LoadingSpinner />
        )
      ) : boosts.length === 0 ? (
        <EmptyHistory text={BOOST_LIST_COPY.empty} />
      ) : (
        <>
          <BoostRows boosts={boosts} onRemove={onRemove} />
          <HistoryPagination
            page={list.page}
            pageCount={list.pageCount}
            range={list.range}
            total={list.total}
            noun={BOOST_LIST_COPY.paginationNoun}
            onPageChange={list.setPage}
          />
        </>
      )}
      <p className="text-content-subtle mt-2 text-xs">
        {BOOST_LIST_COPY.footnote}
      </p>
    </section>
  );
}
