import { cn } from "@/lib/cn";

interface CharacterCounterProps {
  length: number;
  max: number;
}

export function CharacterCounter({ length, max }: CharacterCounterProps) {
  const tooLong = length > max;
  const nearLimit = length >= max - 10;

  return (
    <span
      className={cn(
        "text-xs tabular-nums",
        tooLong
          ? "text-danger"
          : nearLimit
            ? "text-highlight"
            : "text-content-subtle",
      )}
    >
      {length}/{max}
    </span>
  );
}
