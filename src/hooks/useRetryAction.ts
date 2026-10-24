"use client";

import { useCallback, useState } from "react";

const MIN_RETRY_FEEDBACK_MS = 600;

export function useRetryAction(action: () => void | Promise<unknown>) {
  const [isRetrying, setIsRetrying] = useState(false);

  const run = useCallback(async () => {
    setIsRetrying(true);
    try {
      await Promise.all([
        action(),
        new Promise<void>((resolve) =>
          setTimeout(resolve, MIN_RETRY_FEEDBACK_MS),
        ),
      ]);
    } finally {
      setIsRetrying(false);
    }
  }, [action]);

  return { isRetrying, run };
}
