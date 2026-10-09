import { hexToRgba } from "@discordia/client-shared";

const GENERIC_CLASS = "bg-highlight/15 text-highlight rounded px-0.5";

interface MentionChipProps {
  text: string;
  /** Color del rol; sin color se usa el resaltado generico. */
  color?: string | null;
  /** `@everyone` va en negrita. */
  isStrong?: boolean;
}

/** Una mencion dentro del texto de un mensaje. */
export function MentionChip({
  text,
  color,
  isStrong = false,
}: MentionChipProps) {
  if (!color) {
    return (
      <span
        className={isStrong ? `${GENERIC_CLASS} font-semibold` : GENERIC_CLASS}
      >
        {text}
      </span>
    );
  }
  return (
    <span
      className="rounded px-0.5 font-medium"
      style={{ background: hexToRgba(color, 0.16), color }}
    >
      {text}
    </span>
  );
}
