"use client";

import {
  balanceAfterBoost,
  BOOST_CONFIRM_COPY,
  BOOST_COST_POINTS,
  BOOST_OUTCOME_ACTIONS,
  boostLevelLabel,
  boostLevelUpNotice,
  boostOutcomeCopy,
  boostRefundDelta,
  boostRemainingBalanceLabel,
  formatPoints,
  levelChangeIfBoosted,
} from "@discordia/client-shared";

import { useId } from "react";

import { Button } from "@/components/ui/Button";
import { FormAlert } from "@/components/ui/FormAlert";
import { ModalShell } from "@/components/ui/ModalShell";
import { cn } from "@/lib/cn";

import { BoostActionIcon } from "../icons/BoostActionIcon";
import { BoostLevelIcon } from "../icons/BoostLevelIcon";
import type { BoostFlow } from "../hooks/useBoostServer";

interface BoostConfirmModalProps {
  serverName: string;
  /** Boosts del servidor y saldo al abrir el diálogo, antes de este boost. */
  boostCount: number;
  balance: number;
  flow: BoostFlow;
  error: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

function Fact({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-content-subtle">{label}</span>
      <span
        className={cn(
          "font-semibold tabular-nums",
          highlight ? "text-success" : "text-content",
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function BoostConfirmModal({
  serverName,
  boostCount,
  balance,
  flow,
  error,
  onConfirm,
  onClose,
}: BoostConfirmModalProps) {
  const titleId = useId();
  const change = levelChangeIfBoosted(boostCount);
  const context = { serverName, boostCount, balance };

  if (flow.phase === "waiting" || flow.phase === "done") {
    const { outcome } = flow.request.progress;
    const copy = boostOutcomeCopy(outcome, {
      ...context,
      statusDetail: flow.request.boost?.status_detail,
    });
    const leveledUp = outcome === "applied" && change.to !== change.from;
    const action =
      outcome === "applied"
        ? BOOST_OUTCOME_ACTIONS.done
        : outcome === "rejected"
          ? BOOST_OUTCOME_ACTIONS.understood
          : BOOST_OUTCOME_ACTIONS.close;

    return (
      <ModalShell onClose={onClose} labelledBy={titleId} maxWidth={400}>
        <div className="flex flex-col gap-5 px-7 py-8">
          {leveledUp ? (
            <div className="bg-boost-band text-boost-on-band -mx-7 -mt-8 flex items-center gap-3 px-7 py-5">
              <span className="bg-boost-band-tile border-boost-band-line flex size-12 items-center justify-center rounded-xl border">
                <BoostLevelIcon level={change.to} size={30} bare />
              </span>
              <span className="font-display text-xl font-bold">
                {boostLevelLabel(change.to)}
              </span>
            </div>
          ) : (
            <span className="bg-surface-input flex size-12 items-center justify-center rounded-xl">
              {outcome === "applying" ? (
                <span
                  className="border-accent/30 border-t-accent size-6 animate-spin rounded-full border-2"
                  aria-hidden="true"
                />
              ) : (
                <BoostActionIcon size={28} />
              )}
            </span>
          )}

          <div>
            <h2
              id={titleId}
              className="font-display text-content mb-1 text-xl font-bold"
            >
              {copy.title}
            </h2>
            <p
              className="text-content-muted text-sm leading-relaxed"
              aria-live="polite"
            >
              {copy.description}
            </p>
          </div>

          {outcome === "rejected" && flow.request.boost ? (
            <div className="bg-surface-input flex items-center justify-between rounded-xl px-4 py-3 text-sm">
              <span className="text-content-muted">
                {BOOST_OUTCOME_ACTIONS.refundRow}
              </span>
              <span className="font-display text-success font-bold tabular-nums">
                {boostRefundDelta(flow.request.boost)}
              </span>
            </div>
          ) : null}

          {outcome === "applied" ? (
            <p className="text-content-subtle text-xs">
              {boostRemainingBalanceLabel(balance)}
            </p>
          ) : null}

          <FormAlert message={flow.request.error ?? undefined} />

          {flow.phase === "done" || outcome === "applying" ? (
            <Button
              type="button"
              variant={outcome === "applying" ? "secondary" : "primary"}
              onClick={onClose}
            >
              {action}
            </Button>
          ) : null}
        </div>
      </ModalShell>
    );
  }

  const submitting = flow.phase === "submitting";
  const levelUpNotice = boostLevelUpNotice(boostCount);

  return (
    <ModalShell
      onClose={submitting ? () => undefined : onClose}
      labelledBy={titleId}
      maxWidth={400}
    >
      <div className="flex flex-col gap-5 px-7 py-7">
        <div>
          <div className="flex items-center gap-3 pr-8">
            <BoostActionIcon size={24} className="shrink-0" />
            <h2
              id={titleId}
              className="font-display text-content text-xl font-bold"
            >
              {BOOST_CONFIRM_COPY.title}
            </h2>
          </div>
          <p className="text-content-muted mt-2 text-sm leading-relaxed">
            {BOOST_CONFIRM_COPY.description}
          </p>
        </div>

        <div className="bg-surface-input space-y-2.5 rounded-2xl px-4 py-4">
          <Fact
            label={BOOST_CONFIRM_COPY.costLabel}
            value={formatPoints(BOOST_COST_POINTS)}
          />
          <Fact label={BOOST_CONFIRM_COPY.balanceLabel} value={balance} />
          <Fact
            label={BOOST_CONFIRM_COPY.remainingLabel}
            value={balanceAfterBoost(balance)}
            highlight
          />
        </div>

        {levelUpNotice ? (
          <p className="bg-boost-column text-content rounded-xl px-4 py-3 text-sm leading-snug">
            {levelUpNotice}
          </p>
        ) : null}

        <FormAlert message={error ?? undefined} />

        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            disabled={submitting}
            onClick={onClose}
          >
            {BOOST_CONFIRM_COPY.cancel}
          </Button>
          <Button type="button" isLoading={submitting} onClick={onConfirm}>
            {BOOST_CONFIRM_COPY.confirm}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
