"use client";

import { useCallback, useEffect, useState } from "react";

import { changeBus } from "@/lib/changeBus";
import { setVanityCodeRequest } from "@/services/servers/client";

export function useVanityUrl(serverId: string, vanityCode: string | null) {
  const [savedCode, setSavedCode] = useState(vanityCode);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setSavedCode(vanityCode);
  }, [vanityCode]);

  const save = useCallback(
    async (code: string | null): Promise<boolean> => {
      setPending(true);
      setError("");
      const result = await setVanityCodeRequest(serverId, code);
      setPending(false);
      if (!result.ok) {
        setError(result.message);
        return false;
      }
      setSavedCode(result.vanity_code);
      changeBus.publish({ resource: "server", server_id: serverId });
      return true;
    },
    [serverId],
  );

  const clearError = useCallback(() => setError(""), []);

  return { savedCode, pending, error, save, clearError };
}
