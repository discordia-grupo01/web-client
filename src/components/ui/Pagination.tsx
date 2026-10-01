"use client";

import {
  PAGINATION_NEXT,
  PAGINATION_PREVIOUS,
  visiblePages,
} from "@discordia/client-shared";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/cn";

interface PaginationProps {
  /** 1-based. */
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}

const CELL =
  "flex h-10 cursor-pointer items-center justify-center px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-strong disabled:cursor-not-allowed disabled:opacity-40";

/**
 * Barra segmentada `Anterior · 1 2 3 4 5 · Siguiente`. Muestra una ventana de
 * cinco numeros alrededor de la pagina actual. En pantallas angostas los
 * textos de los extremos pasan a ser flechas para que entre en un modal de
 * celular.
 */
export function Pagination({ page, pageCount, onPageChange }: PaginationProps) {
  const isFirst = page <= 1;
  const isLast = page >= pageCount;

  return (
    <nav
      aria-label="Paginación"
      className="border-line-strong bg-surface-input divide-line-strong flex max-w-full divide-x overflow-hidden rounded-xl border"
    >
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={isFirst}
        aria-label={PAGINATION_PREVIOUS}
        className={cn(CELL, "text-content-muted hover:bg-surface-hover")}
      >
        <ChevronLeft size={16} className="sm:hidden" aria-hidden="true" />
        <span className="hidden sm:inline">{PAGINATION_PREVIOUS}</span>
      </button>

      {visiblePages(page, pageCount).map((number) => {
        const isCurrent = number === page;
        return (
          <button
            key={number}
            type="button"
            onClick={() => onPageChange(number)}
            aria-label={`Página ${number}`}
            aria-current={isCurrent ? "page" : undefined}
            className={cn(
              CELL,
              "min-w-9 tabular-nums sm:min-w-11",
              isCurrent
                ? "bg-surface-hover text-accent-strong font-bold"
                : "text-content-muted hover:bg-surface-hover",
            )}
          >
            {number}
          </button>
        );
      })}

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={isLast}
        aria-label={PAGINATION_NEXT}
        className={cn(CELL, "text-content-muted hover:bg-surface-hover")}
      >
        <ChevronRight size={16} className="sm:hidden" aria-hidden="true" />
        <span className="hidden sm:inline">{PAGINATION_NEXT}</span>
      </button>
    </nav>
  );
}
