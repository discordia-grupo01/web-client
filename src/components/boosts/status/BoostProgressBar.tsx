interface BoostProgressBarProps {
  boostCount: number;
  target: number;
  label: string;
}

export function BoostProgressBar({
  boostCount,
  target,
  label,
}: BoostProgressBarProps) {
  const percent = Math.min(100, (boostCount / target) * 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={target}
      aria-valuenow={Math.min(boostCount, target)}
      className="bg-surface-input h-2 w-full overflow-hidden rounded-full"
    >
      <div
        className="bg-accent-strong h-full rounded-full transition-all"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
