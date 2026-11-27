import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export interface DataTableColumn<T> {
  header: string;
  cell: (row: T) => ReactNode;
  /** Ancho y alineacion de la columna, para el encabezado y sus celdas. */
  className?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  isHeaderHiddenOnMobile?: boolean;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  isHeaderHiddenOnMobile = false,
}: DataTableProps<T>) {
  return (
    <div className="border-line overflow-hidden rounded-xl border">
      <table className="w-full table-fixed border-collapse text-left text-sm">
        <thead
          className={cn(
            "bg-surface-sunken",
            isHeaderHiddenOnMobile && "hidden sm:table-header-group",
          )}
        >
          <tr>
            {columns.map((column) => (
              <th
                key={column.header}
                scope="col"
                className={cn(
                  "text-content-subtle px-4 py-2.5 text-[10px] font-bold tracking-wider uppercase",
                  column.className,
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-line divide-y">
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((column) => (
                <td
                  key={column.header}
                  className={cn("px-4 py-3", column.className)}
                >
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
