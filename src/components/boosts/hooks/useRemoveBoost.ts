"use client";

import type { Boost } from "@discordia/client-shared";

import { useCallback, useState } from "react";

import { changeBus } from "@/lib/changeBus";
import { removeBoostRequest } from "@/services/billing/client";

export function useRemoveBoost(onRemoved: (boost: Boost) => void) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = useCallback(
    async (boost: Boost): Promise<boolean> => {
      setPending(true);
      setError(null);
      const result = await removeBoostRequest(boost.id);
      setPending(false);
      if (!result.ok) {
        setError(result.message);
        return false;
      }
      onRemoved(result.data);
      // servers baja el contador al recibir el evento: el nivel puede tardar un
      // instante más y llega con el aviso del socket.
      changeBus.publish({ resource: "server", server_id: boost.server_id });
      return true;
    },
    [onRemoved],
  );

  const clearError = useCallback(() => setError(null), []);

  return { pending, error, remove, clearError };
}
