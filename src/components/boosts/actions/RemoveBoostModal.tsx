"use client";

import {
  BOOST_REMOVE_COPY,
  type Boost,
  boostRemoveImpact,
  boostRemoveNoRefund,
  boostRemoveTitle,
  lostPerksIfRemoved,
} from "@discordia/client-shared";

import { useId } from "react";

import { Button } from "@/components/ui/Button";
import { FormAlert } from "@/components/ui/FormAlert";
import { ModalShell } from "@/components/ui/ModalShell";
import { cn } from "@/lib/cn";

import { BoostLevelIcon } from "../icons/BoostLevelIcon";

interface RemoveBoostModalProps {
  serverName: string;
  boost: Boost;
  /** Boosts del servidor, si se conocen; sin ellos no se anticipa el nivel. */
  boostCount: number | null;
  pending: boolean;
  error: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

export function RemoveBoostModal({
  serverName,
  boost,
  boostCount,
  pending,
  error,
  onConfirm,
  onClose,
}: RemoveBoostModalProps) {
  const titleId = useId();
  const change = boostCount === null ? null : lostPerksIfRemoved(boostCount);
  const dropsLevel = change !== null && change.to !== change.from;

  return (
    <ModalShell
      onClose={pending ? () => undefined : onClose}
      labelledBy={titleId}
      maxWidth={400}
    >
      <div className="flex flex-col gap-5 px-7 py-8">
        <div>
          <h2
            id={titleId}
            className="font-display text-content mb-1 text-xl font-bold"
          >
            {boostRemoveTitle(serverName)}
          </h2>
          <p className="text-content-muted text-sm leading-relaxed">
            {boostRemoveNoRefund(boost)}
          </p>
        </div>

        {change && boostCount !== null ? (
          <div
            className={cn(
              "flex items-start gap-3 rounded-xl px-4 py-3 text-sm leading-snug",
              dropsLevel
                ? "bg-danger-soft text-danger"
                : "bg-surface-input text-content-muted",
            )}
          >
            <BoostLevelIcon level={change.to} size={20} bare />
            <span>{boostRemoveImpact(boostCount)}</span>
          </div>
        ) : null}

        <FormAlert message={error ?? undefined} />

        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            disabled={pending}
            onClick={onClose}
          >
            {BOOST_REMOVE_COPY.cancel}
          </Button>
          <Button
            type="button"
            variant="danger"
            isLoading={pending}
            onClick={onConfirm}
          >
            {BOOST_REMOVE_COPY.confirm}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
