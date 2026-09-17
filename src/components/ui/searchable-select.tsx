"use client";

import { Search } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/cn";

import { Dropdown } from "./dropdown";

export interface SearchableSelectOption {
  id: string;
  label: string;
  /** Punto de color opcional a la izquierda de la opción (roles, etc). */
  color?: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  onSelect: (id: string) => void;
  triggerLabel: string;
  triggerIcon?: ReactNode;
  searchPlaceholder?: string;
  /** Mensaje cuando la lista de opciones está vacía (sin buscar). */
  emptyMessage?: string;
  /** Mensaje cuando la búsqueda no encuentra nada. */
  noResultsMessage?: string;
  align?: "left" | "right";
  className?: string;
}

/**
 * Select con buscador: botón que abre un panel flotante (vía `Dropdown`, con
 * portal -- no lo recorta ningún modal con scroll) con un input de filtro y
 * la lista de opciones. Reemplaza implementaciones ad-hoc como el selector
 * de "Añadir rol".
 */
export function SearchableSelect({
  options,
  onSelect,
  triggerLabel,
  triggerIcon,
  searchPlaceholder = "Buscar...",
  emptyMessage = "No hay opciones para elegir",
  noResultsMessage = "Sin resultados",
  align = "left",
  className,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const anchorRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setQuery("");
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [isOpen]);

  const filtered = options.filter((option) =>
    option.label.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "flex cursor-pointer items-center gap-1 rounded-md border px-2 py-1 text-xs font-semibold transition-colors",
          isOpen
            ? "border-accent/40 bg-accent/15 text-accent-strong"
            : "border-line bg-surface-input text-accent-strong hover:border-line-strong",
          className,
        )}
      >
        {triggerIcon}
        {triggerLabel}
      </button>

      <Dropdown
        anchorRef={anchorRef}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        align={align}
        className="w-56"
      >
        <div className="border-line border-b p-2">
          <div className="bg-surface-input flex items-center gap-2 rounded-lg px-2.5 py-1.5">
            <Search size={12} className="text-content-subtle shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="text-content placeholder:text-content-subtle w-full bg-transparent text-xs outline-none"
            />
          </div>
        </div>
        <div className="max-h-52 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <p className="text-content-subtle px-3 py-3 text-center text-xs">
              {query ? noResultsMessage : emptyMessage}
            </p>
          ) : (
            filtered.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  onSelect(option.id);
                  setIsOpen(false);
                }}
                className="hover:bg-surface-hover flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left transition-colors"
              >
                {option.color ? (
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ background: option.color }}
                  />
                ) : null}
                <span className="text-content truncate text-sm font-medium">
                  {option.label}
                </span>
              </button>
            ))
          )}
        </div>
      </Dropdown>
    </>
  );
}
