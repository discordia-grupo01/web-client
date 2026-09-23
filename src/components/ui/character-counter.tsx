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
            ? // Ambar de aviso: no hay token para este estado intermedio (el
              // `highlight` del tema es otro amarillo, mas claro).
              "text-[#F0B232]"
            : "text-content-subtle",
      )}
    >
      {length}/{max}
    </span>
  );
}
