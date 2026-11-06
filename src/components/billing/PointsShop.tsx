"use client";

import {
  formatArsFromCents,
  formatPoints,
  type PointsPackage,
} from "@discordia/client-shared";

import { ChevronRight } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

import { BILLING_COPY } from "./billingCopy";
import { DiscordiaPointIcon } from "./DiscordiaIcons";

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
    <section>
      <h4 className="font-display text-content text-base font-bold">
        {BILLING_COPY.buyPointsTitle}
      </h4>
      <p className="text-content-subtle mt-1 text-xs">
        {BILLING_COPY.buyPointsHint}
      </p>

      <div
        role="radiogroup"
        aria-label={BILLING_COPY.buyPointsTitle}
        className="mt-4 grid gap-3 sm:grid-cols-3"
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
              <DiscordiaPointIcon size={21} />
              <div className="font-display text-content mt-3 text-xl font-bold tabular-nums">
                {pack.points.toLocaleString("es-AR")}
              </div>
              <div className="text-content-subtle text-[10px] tracking-wider uppercase">
                {BILLING_COPY.pointsUnit}
              </div>
              <div className="text-content-muted mt-3 text-sm font-semibold tabular-nums">
                {formatArsFromCents(pack.price_cents)}
              </div>
            </button>
          );
        })}
      </div>

      {selected ? (
        <Button type="button" className="mt-3" onClick={() => onBuy(selected)}>
          {BILLING_COPY.buyPackage(formatPoints(selected.points))}
          <ChevronRight size={16} />
        </Button>
      ) : null}
    </section>
  );
}
