"use client";

import {
  type DraftSegment,
  mentionChipColors,
  THEMES,
} from "@discordia/client-shared";

import {
  forwardRef,
  type TextareaHTMLAttributes,
  useState,
  type UIEvent,
} from "react";

import { AutoGrowTextarea } from "@/components/ui/AutoGrowTextarea";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/cn";

import { useMessageMentions } from "./MentionsContext";

interface MentionTextareaProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "value"
> {
  value: string;
  /** Tramos del borrador con sus menciones; `null` para un cuadro de texto comun (DMs). */
  segments: DraftSegment[] | null;
  /** Lugar que ocupa en el contenedor (`flex-1`, `self-center`...). */
  wrapperClassName?: string;
}

/**
 * `<textarea>` que resalta las menciones elegidas mientras se escribe. Un
 * textarea no puede pintar partes de su texto, asi que el texto visible lo
 * dibuja una capa detras con el mismo tipo de letra y margenes, y el textarea
 * va encima con el texto transparente (solo se ve el cursor y la seleccion).
 * Los chips son solo un fondo plano, sin relleno: cualquier ancho extra
 * desalinearia el cursor.
 */
export const MentionTextarea = forwardRef<
  HTMLTextAreaElement,
  MentionTextareaProps
>(function MentionTextarea(
  { value, segments, wrapperClassName, className, onScroll, ...props },
  ref,
) {
  const { theme } = useTheme();
  const { sources } = useMessageMentions();
  const [scrollTop, setScrollTop] = useState(0);

  if (segments === null) {
    return (
      <AutoGrowTextarea
        ref={ref}
        value={value}
        className={cn(wrapperClassName, className)}
        onScroll={onScroll}
        {...props}
      />
    );
  }

  const colors = THEMES[theme];
  const roleColorOf = (id: string) =>
    sources?.roles.find((role) => role.id.toLowerCase() === id.toLowerCase())
      ?.color;

  function handleScroll(event: UIEvent<HTMLTextAreaElement>) {
    setScrollTop(event.currentTarget.scrollTop);
    onScroll?.(event);
  }

  return (
    <div className={cn("relative", wrapperClassName)}>
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 overflow-hidden break-words whitespace-pre-wrap",
          className,
        )}
      >
        <div style={{ transform: `translateY(${-scrollTop}px)` }}>
          {segments.map((segment, index) => {
            const chip = mentionChipColors(
              segment.kind,
              colors,
              segment.kind === "role" ? roleColorOf(segment.id) : null,
            );
            return chip ? (
              <span key={index} style={chip}>
                {segment.value}
              </span>
            ) : (
              <span key={index}>{segment.value}</span>
            );
          })}
          {/* Un salto de linea al final no ocupa alto si no tiene nada detras. */}
          {value.endsWith("\n") ? "​" : null}
        </div>
      </div>
      <AutoGrowTextarea
        ref={ref}
        value={value}
        onScroll={handleScroll}
        className={cn(
          "relative block w-full [scrollbar-width:none] text-transparent [&::-webkit-scrollbar]:hidden",
          className,
          "caret-content text-transparent",
        )}
        {...props}
      />
    </div>
  );
});
