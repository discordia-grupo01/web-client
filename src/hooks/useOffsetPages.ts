"use client";

import {
  type BillingResult,
  type ChangeFilter,
  pageCountOf,
  pageRange,
} from "@discordia/client-shared";

import { useCallback, useEffect, useRef, useState } from "react";

import { useRefreshOnChange } from "./useRefreshOnChange";

interface OffsetPage {
  total: number;
  limit: number;
}

interface UseOffsetPagesOptions<P extends OffsetPage> {
  fetchPage: (page: number) => Promise<BillingResult<P>>;
  countOf: (page: P) => number;
  pageSize: number;
  refreshOn: ChangeFilter;
}

export function useOffsetPages<P extends OffsetPage>({
  fetchPage,
  countOf,
  pageSize,
  refreshOn,
}: UseOffsetPagesOptions<P>) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<P | null>(null);
  const [loadError, setLoadError] = useState("");
  const latestRequest = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++latestRequest.current;
    const result = await fetchPage(page);
    if (requestId !== latestRequest.current) return;
    if (!result.ok) {
      setLoadError(result.message);
      return;
    }
    if (countOf(result.data) === 0 && page > 1) {
      setPage(page - 1);
      return;
    }
    setLoadError("");
    setData(result.data);
  }, [fetchPage, countOf, page]);

  useEffect(() => {
    void load();
  }, [load]);

  useRefreshOnChange(refreshOn, load);

  const restart = useCallback(() => {
    if (page === 1) void load();
    else setPage(1);
  }, [page, load]);

  const total = data?.total ?? 0;
  return {
    page,
    setPage,
    data,
    loadError,
    total,
    pageCount: pageCountOf(total, pageSize),
    range: pageRange(page, pageSize, total),
    reload: load,
    restart,
  };
}
