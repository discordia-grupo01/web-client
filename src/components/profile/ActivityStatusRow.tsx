"use client";

import {
  ACTIVITY_STATUS_CHOICE_DESCRIPTION,
  ACTIVITY_STATUS_CHOICE_LABEL,
  ACTIVITY_STATUS_CHOICES,
  ACTIVITY_STATUS_LABEL,
  displayedStatus,
  type ActivityStatusChoice,
} from "@discordia/client-shared";
import { Check, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";

import { SectionLabel } from "@/components/ui/SectionLabel";
import { useFloatingPanel } from "@/hooks/useFloatingPanel";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/cn";

import { ActivityStatusDot } from "./ActivityStatusDot";

interface ActivityStatusRowProps {
  /** `null` mientras no hay conexion con el back: no se puede elegir. */
  status: ActivityStatusChoice | null;
  error?: string;
  onChange: (status: ActivityStatusChoice) => void;
}

/**
 * Selector de estado de actividad del perfil propio. La fila muestra el
 * estado actual; las opciones se abren al costado derecho (desde `sm`) o
 * debajo de la fila en pantallas angostas.
 */
export function ActivityStatusRow({
  status,
  error,
  onChange,
}: ActivityStatusRowProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isWide = useMediaQuery("(min-width: 640px)");
  const anchorRef = useRef<HTMLDivElement>(null);
  const close = () => setIsOpen(false);
  const { panelRef, position } = useFloatingPanel({
    enabled: true,
    isOpen,
    onClose: close,
    anchorRef,
    align: "side",
  });

  function select(choice: ActivityStatusChoice) {
    onChange(choice);
    close();
  }

  const options = (
    <div role="listbox" aria-label="Estado de actividad" className="py-1">
      {ACTIVITY_STATUS_CHOICES.map((choice) => {
        const description = ACTIVITY_STATUS_CHOICE_DESCRIPTION[choice];
        const selected = choice === status;
        return (
          <button
            key={choice}
            type="button"
            role="option"
            aria-selected={selected}
            onClick={() => select(choice)}
            className={cn(
              "hover:bg-surface-hover flex w-full cursor-pointer items-center gap-3 px-3 py-2 text-left transition-colors",
              selected && "bg-surface-hover",
            )}
          >
            <ActivityStatusDot
              status={displayedStatus(choice)}
              size={10}
              className="shrink-0 border-0"
            />
            <span className="min-w-0 flex-1">
              <span className="text-content block text-sm font-medium">
                {ACTIVITY_STATUS_CHOICE_LABEL[choice]}
              </span>
              {description ? (
                <span className="text-content-subtle block text-xs">
                  {description}
                </span>
              ) : null}
            </span>
            {selected ? (
              <Check size={14} className="text-accent-strong shrink-0" />
            ) : null}
          </button>
        );
      })}
    </div>
  );

  return (
    <div>
      <SectionLabel>Estado de actividad</SectionLabel>
      <div ref={anchorRef} className="mt-1.5">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          disabled={status === null}
          onClick={() => setIsOpen((prev) => !prev)}
          className={cn(
            "bg-surface-input border-line hover:border-line-strong flex w-full cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
            isOpen && "border-line-strong",
            status === null && "cursor-default opacity-60",
          )}
        >
          <ActivityStatusDot
            status={status ? displayedStatus(status) : "offline"}
            size={10}
            className="shrink-0 border-0"
          />
          <span className="text-content min-w-0 flex-1 text-sm font-semibold">
            {status
              ? ACTIVITY_STATUS_CHOICE_LABEL[status]
              : ACTIVITY_STATUS_LABEL.offline}
          </span>
          <ChevronRight
            size={16}
            className={cn(
              "text-content-subtle shrink-0 transition-transform",
              isOpen && !isWide && "rotate-90",
            )}
          />
        </button>

        {isOpen && !isWide ? (
          <div className="bg-surface-raised border-line-strong mt-1.5 overflow-hidden rounded-lg border">
            {options}
          </div>
        ) : null}
        {error ? (
          <p role="alert" className="text-danger mt-1 text-xs">
            {error}
          </p>
        ) : null}
      </div>

      {isOpen && isWide && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={panelRef}
              className={cn(
                "bg-surface-raised border-line-strong fixed z-50 w-64 overflow-hidden rounded-xl border shadow-2xl",
                !position && "invisible",
              )}
              style={{
                top: position?.top ?? -9999,
                left: position?.left ?? -9999,
              }}
            >
              {options}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
