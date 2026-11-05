import { paginationSummary } from "@discordia/client-shared";

import { Pagination } from "@/components/ui/Pagination";

interface HistoryPaginationProps {
  page: number;
  pageCount: number;
  range: { from: number; to: number };
  total: number;
  noun: string;
  onPageChange: (page: number) => void;
}

export function HistoryPagination({
  page,
  pageCount,
  range,
  total,
  noun,
  onPageChange,
}: HistoryPaginationProps) {
  if (pageCount <= 1) return null;

  return (
    <div className="mt-3 flex flex-col items-center gap-2">
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
