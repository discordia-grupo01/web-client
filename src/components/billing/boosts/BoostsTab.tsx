"use client";

import {
  BILLING_BOOSTS_COPY,
  BOOST_ACTION_COPY,
  BOOST_TIER_SUMMARIES,
  groupBoostsByServer,
  ownBoostsLabel,
  RETRY_LABEL,
  serverBoostCount,
  serverBoostLevel,
  serverBoostsSummaryLabel,
} from "@discordia/client-shared";

import { BoostLevelIcon } from "@/components/boosts/icons/BoostLevelIcon";
import { useOwnBoosts } from "@/components/boosts/hooks/useOwnBoosts";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { FormAlert } from "@/components/ui/FormAlert";
import { serverIconSrc } from "@/utils/image-urls";
import { requestServerBoosts } from "@/utils/serverBoostsRequest";

import { EmptyHistory } from "../history/EmptyHistory";
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

interface BoostsTabProps {
  onBuyPoints: () => void;
}

export function BoostsTab({ onBuyPoints }: BoostsTabProps) {
  const own = useOwnBoosts();
  const servers = useServerDirectory();
  const groups =
    own.state.status === "ready" ? groupBoostsByServer(own.state.boosts) : [];

  return (
    <>
      <HowBoostsWork onBuyPoints={onBuyPoints} />

      <section>
        <h4 className="font-display text-content mb-3 text-base font-bold">
          {BILLING_BOOSTS_COPY.yourBoostsTitle}
        </h4>
        {own.state.status === "error" ? (
          <div className="space-y-3">
            <FormAlert message={own.state.message} />
            <Button
              type="button"
              variant="secondary"
              onClick={() => void own.reload()}
            >
              {RETRY_LABEL}
            </Button>
          </div>
        ) : own.state.status === "loading" || servers === null ? (
          <p className="text-content-subtle text-sm">Cargando…</p>
        ) : groups.length === 0 ? (
          <EmptyHistory text={BILLING_BOOSTS_COPY.empty} />
        ) : (
          <ul className="border-line divide-line divide-y overflow-hidden rounded-2xl border">
            {groups.map((group) => {
              const server = servers.get(group.serverId);
              return (
                <li
                  key={group.serverId}
                  className="bg-surface-raised flex items-center gap-3 px-4 py-3"
                >
                  <Avatar
                    name={server?.name ?? "?"}
                    src={server ? serverIconSrc(server) : undefined}
                    size={40}
                    className="rounded-xl"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-content truncate text-sm font-bold">
                      {server?.name ?? BILLING_BOOSTS_COPY.unknownServer}
                    </p>
                    <p className="text-content-subtle mt-0.5 flex items-center gap-1.5 text-xs">
                      {server ? (
                        <BoostLevelIcon
                          level={serverBoostLevel(server)}
                          size={14}
                          bare
                          tight
                        />
                      ) : null}
                      {server
                        ? serverBoostsSummaryLabel(
                            serverBoostLevel(server),
                            serverBoostCount(server),
                            group.boosts.length,
                          )
                        : ownBoostsLabel(group.boosts.length)}
                    </p>
                  </div>
                  {server ? (
                    <button
                      type="button"
                      onClick={() => requestServerBoosts(group.serverId)}
                      className="bg-surface-input text-content-muted hover:text-content shrink-0 cursor-pointer rounded-xl px-4 py-2 text-xs font-semibold transition-colors"
                    >
                      {BILLING_BOOSTS_COPY.manage}
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
