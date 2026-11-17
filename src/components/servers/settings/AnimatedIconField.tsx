"use client";

import {
  ANIMATED_SERVER_ICON_COPY,
  type BoostLevel,
  canUseAnimatedServerIcon,
} from "@discordia/client-shared";
import { Upload } from "lucide-react";
import { useRef } from "react";

import { BoostBenefitField } from "@/components/boosts/benefits/BoostBenefitField";
import { cn } from "@/lib/cn";

interface AnimatedIconFieldProps {
  level: BoostLevel;
  boostCount: number;
  onPickIcon: (file: File) => void;
}

export function AnimatedIconField({
  level,
  boostCount,
  onPickIcon,
}: AnimatedIconFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const unlocked = canUseAnimatedServerIcon(level);

  return (
    <BoostBenefitField
      perk="animated_icon"
      level={level}
      boostCount={boostCount}
      title={ANIMATED_SERVER_ICON_COPY.title}
    >
      <div
        className={cn(
          "border-line flex items-center gap-3.5 rounded-xl border p-3.5",
          unlocked && "bg-accent/10",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "flex size-13 shrink-0 items-center justify-center rounded-xl text-[13px] font-extrabold tracking-wide",
            unlocked
              ? "bg-boost-yellow text-boost-ink"
              : "border-line bg-surface-raised text-content-muted border",
          )}
        >
          {ANIMATED_SERVER_ICON_COPY.badge}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="text-content-muted text-xs leading-relaxed">
            {unlocked
              ? ANIMATED_SERVER_ICON_COPY.unlocked
              : ANIMATED_SERVER_ICON_COPY.locked}
          </p>
          {unlocked ? (
            <>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="border-line-strong text-content hover:bg-surface-hover mt-1.5 flex h-8 cursor-pointer items-center gap-1.5 self-start rounded-[10px] border px-3 text-[13px] font-semibold transition-colors"
              >
                <Upload size={14} strokeWidth={2.2} aria-hidden="true" />
                {ANIMATED_SERVER_ICON_COPY.upload}
              </button>
              <input
                ref={inputRef}
                type="file"
                accept="image/gif"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) onPickIcon(file);
                  event.target.value = "";
                }}
              />
            </>
          ) : null}
        </div>
      </div>
    </BoostBenefitField>
  );
}
