"use client";

import { Search } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { useFloatingPanel } from "@/hooks/use-floating-panel";
import { cn } from "@/lib/cn";

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
  /**
   * Por default el panel se posiciona inline (`absolute`, como cualquier
   * menu de la app). Activar solo cuando el select vive dentro de un
   * contenedor con scroll que lo recorta -- hoy, el único caso real es
   * "Añadir rol" en el modal de perfil.
   */
  floating?: boolean;
}

/**
 * Select con buscador: botón que abre un panel con un input de filtro y la
 * lista de opciones.
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
  floating = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const anchorRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const close = () => setIsOpen(false);
  const { panelRef, position } = useFloatingPanel({
    enabled: floating,
    isOpen,
    onClose: close,
    anchorRef,
    align,
  });

  useEffect(() => {
    if (!isOpen) return;
    setQuery("");
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [isOpen]);

  const filtered = options.filter((option) =>
    option.label.toLowerCase().includes(query.toLowerCase()),
  );

  const panelContent = (
    <>
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
                close();
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
    </>
  );

  return (
    <div className="relative">
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

      {isOpen && floating && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={panelRef}
              className={cn(
                "bg-surface-raised border-line-strong fixed z-50 w-56 max-w-[calc(100vw-1rem)] overflow-hidden rounded-xl border shadow-2xl",
                !position && "invisible",
              )}
              style={{
                top: position?.top ?? -9999,
                left: position?.left,
                right: position?.right,
              }}
            >
              {panelContent}
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
          <div
            className={cn(
              "bg-surface-raised border-line-strong absolute top-full z-50 mt-1.5 w-56 overflow-hidden rounded-xl border shadow-2xl",
              align === "right" ? "right-0" : "left-0",
            )}
          >
            {panelContent}
          </div>
        </>
      ) : null}
    </div>
  );
}
