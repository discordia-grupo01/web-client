import { cn } from "@/lib/cn";

interface CharacterCounterProps {
  length: number;
  max: number;
}

/** `12/100` al lado de la etiqueta de un campo, en ambar cerca del limite. */
export function CharacterCounter({ length, max }: CharacterCounterProps) {
  const tooLong = length > max;
  const nearLimit = length >= max - 10;

  return (
    <span
      className={cn(
        "font-mono text-xs tabular-nums",
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
