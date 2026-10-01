"use client";

import { Check, ChevronDown } from "lucide-react";
import { createPortal } from "react-dom";
import { useId, useRef, useState } from "react";

import { useFloatingPanel } from "@/hooks/use-floating-panel";
import { cn } from "@/lib/cn";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  id?: string;
  /**
   * Por default el panel se posiciona inline (`absolute`, como cualquier
   * select de la app). Activar solo cuando vive dentro de un contenedor con
   * scroll que lo recorta.
   */
  floating?: boolean;
}

/**
 * Select estilizado sin buscador (para listas cortas, ej. categorías de un
 * canal) -- reemplaza un `<select>` nativo, cuyo popup de opciones no se
 * puede estilizar en ningún browser. Para listas donde conviene filtrar por
 * texto usar `SearchableSelect` en su lugar.
 */
export function Select({
  label,
  value,
  onChange,
  options,
  id,
  floating = false,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const selected = options.find((option) => option.value === value);
  const close = () => setIsOpen(false);
  const { panelRef, position } = useFloatingPanel({
    enabled: floating,
    isOpen,
    onClose: close,
    anchorRef,
    align: "stretch",
  });

  const optionsList = (
    <div className="max-h-52 overflow-y-auto py-1">
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              onChange(option.value);
              close();
            }}
            className="hover:bg-surface-hover flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left transition-colors"
          >
            <span
              className={cn(
                "min-w-0 flex-1 truncate text-sm font-medium",
                isSelected ? "text-accent-strong" : "text-content",
              )}
            >
              {option.label}
            </span>
            {isSelected ? (
              <Check size={14} className="text-accent-strong shrink-0" />
            ) : null}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="relative">
      <label
        htmlFor={selectId}
        className="text-content-subtle mb-1.5 block text-xs font-bold tracking-wider uppercase"
      >
        {label}
      </label>
      <button
        id={selectId}
        ref={anchorRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "bg-surface-input border-line text-content flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border px-4 py-3 text-left text-sm transition-colors",
          isOpen && "border-accent",
        )}
      >
        <span className={cn("truncate", !selected && "text-content-subtle")}>
          {selected?.label ?? "Seleccionar..."}
        </span>
        <ChevronDown
          size={15}
          className={cn(
            "text-content-subtle shrink-0 transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen && floating && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={panelRef}
              className={cn(
                "bg-surface-raised border-line-strong fixed z-50 max-w-[calc(100vw-1rem)] overflow-hidden rounded-xl border shadow-2xl",
                !position && "invisible",
              )}
              style={{
                top: position?.top ?? -9999,
                left: position?.left,
                width: position?.width,
              }}
            >
              {optionsList}
            </div>,
            document.body,
          )
        : null}

      {isOpen && !floating ? (
        <>
          <button
            type="button"
            aria-label="Cerrar selector"
            onClick={close}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div className="bg-surface-raised border-line-strong absolute top-full left-0 z-50 mt-1.5 w-full overflow-hidden rounded-xl border shadow-2xl">
            {optionsList}
          </div>
        </>
      ) : null}
    </div>
  );
}
