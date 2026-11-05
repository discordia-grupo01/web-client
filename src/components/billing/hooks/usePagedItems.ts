import {
  clampPage,
  pageCountOf,
  pageRange,
  paginate,
} from "@discordia/client-shared";

import { useState } from "react";

export function usePagedItems<T>(items: readonly T[], pageSize: number) {
  const [requestedPage, setPage] = useState(1);
  const pageCount = pageCountOf(items.length, pageSize);
  const page = clampPage(requestedPage, pageCount);

  return {
    page,
    pageCount,
    setPage,
    pageItems: paginate(items, page, pageSize),
    range: pageRange(page, pageSize, items.length),
    total: items.length,
  };
}
