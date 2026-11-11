"use client";

import {
  type ClosedReportStatus,
  pageCountOf,
  type Report,
  REPORTS_PAGE_SIZE,
  type ReportResolutionAction,
  type ReportStatus,
} from "@discordia/client-shared";
import { useCallback, useEffect, useRef, useState } from "react";

import { useRefreshOnChange } from "@/hooks/useRefreshOnChange";
import {
  closeReportRequest,
  listReportsRequest,
} from "@/services/reports/client";

export type ReportsTab = "pending" | "closed";

/** `alreadyClosed`: lo habia cerrado otro moderador; la fila sale igual. */
export type CloseOutcome =
  | { ok: true; alreadyClosed: false }
  | { ok: true; alreadyClosed: true; message: string }
  | { ok: false; message: string };

function statusFor(tab: ReportsTab, closedFilter: ClosedReportStatus) {
  return tab === "pending" ? "pending" : closedFilter;
}

/**
 * Una pagina de reportes por estado. Cerrados se pide por estado exacto
 * (resueltos o descartados) para que el `total` del back sirva para paginar.
 */
export function useReportsList(serverId: string, onPendingClosed: () => void) {
  const [tab, setTabState] = useState<ReportsTab>("pending");
  const [closedFilter, setClosedFilterState] =
    useState<ClosedReportStatus>("resolved");
  const [page, setPage] = useState(1);
  const [reports, setReports] = useState<Report[] | null>(null);
  const [total, setTotal] = useState(0);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const status: ReportStatus = statusFor(tab, closedFilter);

  useEffect(() => {
    let cancelled = false;
    setReports(null);
    setLoadError("");
    listReportsRequest(serverId, {
      status,
      limit: REPORTS_PAGE_SIZE,
      offset: (page - 1) * REPORTS_PAGE_SIZE,
    }).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setLoadError(result.message);
        setReports([]);
        return;
      }
      setReports(result.reports);
      setTotal(result.total);
    });
    return () => {
      cancelled = true;
    };
  }, [serverId, status, page, reloadKey]);

  const requestKey = `${serverId}:${status}:${page}`;
  const requestKeyRef = useRef(requestKey);
  useEffect(() => {
    requestKeyRef.current = requestKey;
  }, [requestKey]);

  const refreshReports = useCallback(async () => {
    const key = requestKey;
    const result = await listReportsRequest(serverId, {
      status,
      limit: REPORTS_PAGE_SIZE,
      offset: (page - 1) * REPORTS_PAGE_SIZE,
    });
    if (!result.ok || key !== requestKeyRef.current) return;
    setReports(result.reports);
    setTotal(result.total);
  }, [requestKey, serverId, status, page]);

  useRefreshOnChange({ resources: ["reports"], serverId }, refreshReports);

  const removeLocally = useCallback(
    (reportId: string) => {
      setReports((current) =>
        current ? current.filter((report) => report.id !== reportId) : current,
      );
      setTotal((current) => Math.max(current - 1, 0));
      onPendingClosed();
      const isLastOnPage = reports?.length === 1 && reports[0]?.id === reportId;
      if (isLastOnPage && total > 1) {
        setPage((current) => Math.max(current - 1, 1));
        setReloadKey((key) => key + 1);
      }
    },
    [reports, total, onPendingClosed],
  );

  const close = useCallback(
    async (
      reportId: string,
      closing: ClosedReportStatus,
      action: ReportResolutionAction | null = null,
    ): Promise<CloseOutcome> => {
      const result = await closeReportRequest(
        serverId,
        reportId,
        closing,
        action,
      );
      if (result.ok) {
        removeLocally(reportId);
        return { ok: true, alreadyClosed: false };
      }
      if (result.isGone) {
        removeLocally(reportId);
        return { ok: true, alreadyClosed: true, message: result.message };
      }
      return { ok: false, message: result.message };
    },
    [serverId, removeLocally],
  );

  function setTab(next: ReportsTab) {
    setTabState(next);
    setPage(1);
  }

  function setClosedFilter(next: ClosedReportStatus) {
    setClosedFilterState(next);
    setPage(1);
  }

  return {
    tab,
    setTab,
    closedFilter,
    setClosedFilter,
    status,
    page,
    pageCount: pageCountOf(total, REPORTS_PAGE_SIZE),
    setPage,
    reports,
    total,
    loadError,
    reload: () => setReloadKey((key) => key + 1),
    close,
  };
}

export type ReportsList = ReturnType<typeof useReportsList>;
