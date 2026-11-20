"use client";

import type { TwoFactorStatus } from "@discordia/client-shared";

import { useEffect, useState } from "react";

import { twoFactorStatusRequest } from "@/services/two-factor/client";

export function useTwoFactorStatus() {
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    void twoFactorStatusRequest().then((result) => {
      if (isCancelled) return;
      setIsLoading(false);
      if (result.ok) setStatus(result.status);
      else setLoadError(result.message);
    });
    return () => {
      isCancelled = true;
    };
  }, []);

  return { status, isLoading, loadError };
}
