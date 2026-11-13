"use client";

import {
  DEFAULT_PAGE_SIZE,
  type ModerationAuditEntry,
  pageCountOf,
  pageRange,
} from "@discordia/client-shared";
import { useEffect, useState } from "react";

import { listModerationAuditRequest } from "@/services/moderation/client";

export function useModerationAudit(serverId: string) {
  const [page, setPage] = useState(1);
  const [entries, setEntries] = useState<ModerationAuditEntry[] | null>(null);
  const [total, setTotal] = useState(0);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setEntries(null);
    setLoadError("");
    listModerationAuditRequest(serverId, {
      limit: DEFAULT_PAGE_SIZE,
      offset: (page - 1) * DEFAULT_PAGE_SIZE,
    }).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setLoadError(result.message);
        setEntries([]);
        return;
      }
      setEntries(result.entries);
      setTotal(result.total);
    });
    return () => {
      cancelled = true;
    };
  }, [serverId, page]);

  return {
    page,
    pageCount: pageCountOf(total, DEFAULT_PAGE_SIZE),
    range: pageRange(page, DEFAULT_PAGE_SIZE, total),
    total,
    setPage,
    entries,
    loadError,
  };
}
