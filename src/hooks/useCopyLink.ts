"use client";

import { INVITE_COPY_FAILED } from "@discordia/client-shared";

import { useCallback, useEffect, useRef, useState } from "react";

const COPIED_FEEDBACK_MS = 2000;

export function useCopyLink() {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const copy = useCallback(async (link: string) => {
    setError("");
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      setError(INVITE_COPY_FAILED);
      return;
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
  }, []);

  return { copied, error, copy };
}
