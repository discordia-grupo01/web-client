import { cn } from "@/lib/cn";

interface BoostProgressBarProps {
  boostCount: number;
  target: number;
  label: string;
  size?: "md" | "sm";
}

export function BoostProgressBar({
  boostCount,
  target,
  label,
  size = "md",
}: BoostProgressBarProps) {
  const ratio = Math.min(1, boostCount / target);
  const percent = `${Math.round(ratio * 1000) / 10}%`;
  const isSmall = size === "sm";

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={target}
      aria-valuenow={Math.min(boostCount, target)}
      className={cn("relative", isSmall ? "h-2.5" : "h-4")}
    >
      <div
        className={cn(
          "bg-boost-track absolute inset-x-0 overflow-hidden rounded-full",
          isSmall ? "top-0.5 h-1.5" : "top-0.75 h-2.5",
        )}
      >
        <div
          className="bg-info h-full rounded-full"
          style={{ width: percent }}
        />
      </div>
      <span
        className={cn(
          "bg-boost-yellow border-boost-ink absolute top-0 -translate-x-1/2",
          isSmall
            ? "size-2.5 rounded-[3px] border-[1.5px]"
            : "size-4 rounded border-2",
        )}
        style={{ left: percent }}
      />
    </div>
  );
}
