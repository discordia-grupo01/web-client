"use client";

import type { StaffNotice } from "@discordia/client-shared";

import { useCallback, useEffect, useRef, useState } from "react";

import { useRefreshOnChange } from "@/hooks/useRefreshOnChange";
import {
  listStaffNoticesRequest,
  markStaffNoticeSeenRequest,
} from "@/services/notifications/client";

export function useStaffNotices() {
  const [notices, setNotices] = useState<StaffNotice[]>([]);
  // Un listado que salió antes de cerrar el aviso todavía lo trae: sin esto
  // el modal volvería a aparecer hasta que el back guarde el visto.
  const dismissedRef = useRef(new Set<string>());

  const refresh = useCallback(async () => {
    const result = await listStaffNoticesRequest();
    if (!result.ok) return;
    setNotices(
      result.notices.filter((notice) => !dismissedRef.current.has(notice.id)),
    );
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useRefreshOnChange({ resources: ["notices"] }, refresh, { pollMs: null });

  const dismiss = useCallback((noticeId: string) => {
    dismissedRef.current.add(noticeId);
    setNotices((prev) => prev.filter((notice) => notice.id !== noticeId));
    void markStaffNoticeSeenRequest(noticeId);
  }, []);

  return { notice: notices[0] ?? null, dismiss };
}
