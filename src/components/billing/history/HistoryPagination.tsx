import { PaginationFooter } from "@/components/ui/PaginationFooter";

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
    <PaginationFooter
      page={page}
      pageCount={pageCount}
      range={range}
      total={total}
      noun={noun}
      onPageChange={onPageChange}
      className="mt-3"
    />
  );
}
