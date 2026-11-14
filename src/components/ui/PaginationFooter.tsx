import { paginationSummary } from "@discordia/client-shared";

import { cn } from "@/lib/cn";

import { Pagination } from "./Pagination";

interface PaginationFooterProps {
  page: number;
  pageCount: number;
  range: { from: number; to: number };
  total: number;
  /** Lo que se esta contando: "baneados", "miembros", "acciones". */
  noun: string;
  onPageChange: (page: number) => void;
  className?: string;
}

/**
 * "Mostrando 1–20 de 44 baneados" y la barra de paginas. En celular van
 * apilados y centrados; desde `sm`, en una fila con el resumen a la izquierda.
 * Si la fila no entra (panel angosto, muchas paginas) baja a dos lineas.
 */
export function PaginationFooter({
  page,
  pageCount,
  range,
  total,
  noun,
  onPageChange,
  className,
}: PaginationFooterProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap sm:justify-between sm:gap-x-4",
        className,
      )}
    >
      <p aria-live="polite" className="text-content-muted text-xs">
        {paginationSummary(range.from, range.to, total, noun)}
      </p>
      <Pagination
        page={page}
        pageCount={pageCount}
        onPageChange={onPageChange}
      />
    </div>
  );
}
