"use client";

import { statusNoticeKey } from "@discordia/client-shared";
import { useState } from "react";

import { useHiddenNotice } from "./hooks/useHiddenNotice";
import { usePlatformStatus } from "./hooks/usePlatformStatus";
import { PlatformStatusBanner } from "./PlatformStatusBanner";
import { PlatformStatusModal } from "./PlatformStatusModal";

export function PlatformStatusNotice() {
  const { state } = usePlatformStatus();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const data = state.phase === "ready" ? state.data : null;
  const { isHidden, hide } = useHiddenNotice(
    statusNoticeKey(data?.incidents ?? []),
  );

  if (!data || data.incidents.length === 0) return null;

  return (
    <>
      {isHidden ? null : (
        <PlatformStatusBanner
          status={data.status}
          incidents={data.incidents}
          onOpenDetails={() => setIsDetailsOpen(true)}
          onHide={hide}
        />
      )}
      {isDetailsOpen ? (
        <PlatformStatusModal
          data={data}
          onClose={() => setIsDetailsOpen(false)}
        />
      ) : null}
    </>
  );
}
