"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "discordia:hidden-status-notice";

function readHiddenKey(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function useHiddenNotice(noticeKey: string) {
  const [hiddenKey, setHiddenKey] = useState<string | null>(null);

  useEffect(() => {
    setHiddenKey(readHiddenKey());
  }, []);

  const hide = useCallback(() => {
    setHiddenKey(noticeKey);
    try {
      sessionStorage.setItem(STORAGE_KEY, noticeKey);
    } catch {
      // Sin storage el aviso igual se oculta hasta recargar.
    }
  }, [noticeKey]);

  return { isHidden: hiddenKey === noticeKey, hide };
}
