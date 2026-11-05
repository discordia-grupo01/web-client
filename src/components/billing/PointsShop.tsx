"use client";

import {
  formatArsFromCents,
  formatPoints,
  type PointsPackage,
} from "@discordia/client-shared";

import { Zap } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

import { BILLING_COPY } from "./billingCopy";

interface PointsShopProps {
  packages: PointsPackage[];
  onBuy: (pack: PointsPackage) => void;
}

export function PointsShop({ packages, onBuy }: PointsShopProps) {
  const [selectedId, setSelectedId] = useState(
    packages[Math.floor(packages.length / 2)]?.id ?? null,
  );
  const selected = packages.find((pack) => pack.id === selectedId);

  return (
    <section className="space-y-3">
      <div>
        <h4 className="font-display text-content text-base font-bold">
          {BILLING_COPY.buyPointsTitle}
        </h4>
        <p className="text-content-subtle mt-1 text-xs">
          {BILLING_COPY.buyPointsHint}
        </p>
      </div>

      <div
        role="radiogroup"
        aria-label={BILLING_COPY.buyPointsTitle}
        className="grid gap-3 sm:grid-cols-3"
      >
        {packages.map((pack) => {
          const active = pack.id === selectedId;
          return (
            <button
              key={pack.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setSelectedId(pack.id)}
              className={cn(
                "cursor-pointer rounded-2xl border-2 p-4 text-left transition-colors",
                active
                  ? "border-accent bg-accent/15"
                  : "border-line bg-surface-raised hover:border-line-strong",
              )}
            >
              <Zap size={18} className="text-highlight" />
              <div className="font-display text-content mt-3 text-lg font-bold">
                {formatPoints(pack.points)}
              </div>
              <div className="text-content-muted mt-2 text-sm font-semibold">
                {formatArsFromCents(pack.price_cents)}
              </div>
            </button>
          );
        })}
      </div>

      {selected ? (
        <Button type="button" onClick={() => onBuy(selected)}>
          {BILLING_COPY.buyPackage(formatPoints(selected.points))}
        </Button>
      ) : null}
    </section>
  );
}
