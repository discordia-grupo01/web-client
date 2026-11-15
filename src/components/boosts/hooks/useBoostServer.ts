"use client";

import {
  applyBoostStep,
  BOOST_STATUS_POLL_MS,
  boostRequestStarted,
  type BoostRequestState,
  type BoostStatusApi,
  checkBoostStep,
  newIdempotencyKey,
} from "@discordia/client-shared";

import { useCallback, useRef, useState } from "react";

import { useRefreshOnChange } from "@/hooks/useRefreshOnChange";
import { changeBus } from "@/lib/changeBus";
import {
  getBoostRequest,
  requestBoostRequest,
} from "@/services/billing/client";

export type BoostFlow =
  | { phase: "idle" }
  | { phase: "submitting" }
  | { phase: "waiting" | "done"; request: BoostRequestState };

const STATUS_API: BoostStatusApi = { getBoost: getBoostRequest };

/**
 * Pide un boost y espera a que billing lo deje activo o lo rechace: escucha el
 * aviso `boosts` y, por si el socket está caído, consulta cada
 * `BOOST_STATUS_POLL_MS`.
 */
export function useBoostServer(serverId: string) {
  const [flow, setFlow] = useState<BoostFlow>({ phase: "idle" });
  const [error, setError] = useState<string | null>(null);
  const keyRef = useRef(newIdempotencyKey());
  const requestRef = useRef<BoostRequestState | null>(null);
  const startedAt = useRef(0);
  const checking = useRef(false);

  const finish = useCallback(
    (request: BoostRequestState, done: boolean) => {
      requestRef.current = request;
      setFlow({ phase: done ? "done" : "waiting", request });
      // Cuando el boost queda activo, servers ya recalculó el nivel: se avisa
      // acá para no depender del aviso del socket.
      if (request.progress.outcome === "applied") {
        changeBus.publish({ resource: "server", server_id: serverId });
      }
    },
    [serverId],
  );

  const submit = useCallback(async () => {
    if (flow.phase !== "idle") return;
    setFlow({ phase: "submitting" });
    setError(null);
    const result = await requestBoostRequest(serverId, keyRef.current);
    if (!result.ok) {
      if (result.code === "IDEMPOTENCY_KEY_REUSED") {
        keyRef.current = newIdempotencyKey();
      }
      setError(result.message);
      setFlow({ phase: "idle" });
      return;
    }
    keyRef.current = newIdempotencyKey();
    startedAt.current = Date.now();
    const started = boostRequestStarted(result.data);
    finish(started, started.progress.done);
  }, [finish, flow.phase, serverId]);

  const check = useCallback(async () => {
    const current = requestRef.current;
    const boostId = current?.boost?.id;
    if (!current || !boostId || checking.current) return;
    checking.current = true;
    const elapsed = Date.now() - startedAt.current;
    const step = await checkBoostStep(boostId, elapsed, STATUS_API);
    checking.current = false;
    if (requestRef.current !== current) return;
    const applied = applyBoostStep(current, step, elapsed);
    finish(applied.state, applied.finished);
  }, [finish]);

  useRefreshOnChange({ resources: ["boosts"] }, check, {
    enabled: flow.phase === "waiting",
    pollMs: BOOST_STATUS_POLL_MS,
  });

  const reset = useCallback(() => {
    requestRef.current = null;
    setFlow({ phase: "idle" });
    setError(null);
  }, []);

  return { flow, error, submit, reset };
}
