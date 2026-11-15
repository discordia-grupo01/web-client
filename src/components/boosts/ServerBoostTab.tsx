"use client";

import {
  type Boost,
  boostBlockReason,
  RETRY_LABEL,
  type ServerBoostSummary,
  type ServerSummary,
} from "@discordia/client-shared";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { FormAlert } from "@/components/ui/FormAlert";

import { BoostActionCard } from "./actions/BoostActionCard";
import { BoostConfirmModal } from "./actions/BoostConfirmModal";
import { RemoveBoostModal } from "./actions/RemoveBoostModal";
import { ServerBoostList } from "./actions/ServerBoostList";
import { useBoostServer } from "./hooks/useBoostServer";
import { usePointsBalance } from "./hooks/usePointsBalance";
import { useRemoveBoost } from "./hooks/useRemoveBoost";
import { useServerBoostsPage } from "./hooks/useServerBoostsPage";
import { BoostStatusCard } from "./status/BoostStatusCard";

interface ServerBoostTabProps {
  server: ServerSummary;
  summary: ServerBoostSummary;
  /** Vuelve a pedir el resumen del servidor (nivel y contador). */
  onSummaryStale: () => void;
  onBuyPoints: () => void;
}

interface ConfirmSnapshot {
  boostCount: number;
  balance: number;
}

export function ServerBoostTab({
  server,
  summary,
  onSummaryStale,
  onBuyPoints,
}: ServerBoostTabProps) {
  const points = usePointsBalance();
  const list = useServerBoostsPage(server.id);
  const boosting = useBoostServer(server.id);
  const removing = useRemoveBoost(list.restart);
  const [confirm, setConfirm] = useState<ConfirmSnapshot | null>(null);
  const [toRemove, setToRemove] = useState<Boost | null>(null);
  // El resumen vivo: si otro miembro completa los 30, se ve aunque el diálogo esté abierto.
  const capReached = summary.next_level === null;

  const finished = boosting.flow.phase === "done";
  const { reload: reloadPoints } = points;
  const { restart: restartList } = list;
  useEffect(() => {
    // Al terminar no se espera solo al socket: se piden el nivel, el saldo y la
    // primera página, donde queda el boost nuevo.
    if (!finished) return;
    onSummaryStale();
    void reloadPoints();
    restartList();
  }, [finished, onSummaryStale, reloadPoints, restartList]);

  function openConfirm(balance: number) {
    boosting.reset();
    setConfirm({ boostCount: summary.boost_count, balance });
  }

  function closeConfirm() {
    setConfirm(null);
    boosting.reset();
  }

  function closeRemove() {
    setToRemove(null);
    removing.clearError();
  }

  async function confirmRemove() {
    if (!toRemove || !(await removing.remove(toRemove))) return;
    setToRemove(null);
    onSummaryStale();
  }

  return (
    <div className="space-y-7">
      <BoostStatusCard summary={summary} />

      {points.state.status === "error" ? (
        <div className="space-y-3">
          <FormAlert message={points.state.message} />
          <Button
            type="button"
            variant="secondary"
            onClick={() => void points.reload()}
          >
            {RETRY_LABEL}
          </Button>
        </div>
      ) : points.state.status === "loading" ? (
        <p className="text-content-subtle text-sm">Cargando…</p>
      ) : (
        <BoostActionCard
          serverName={server.name}
          balance={points.state.balance}
          blockReason={boostBlockReason({
            boostCount: summary.boost_count,
            balance: points.state.balance,
          })}
          onBoost={() =>
            points.state.status === "ready" && openConfirm(points.state.balance)
          }
          onBuyPoints={onBuyPoints}
        />
      )}

      <ServerBoostList list={list} onRemove={setToRemove} />

      {confirm ? (
        <BoostConfirmModal
          serverName={server.name}
          boostCount={confirm.boostCount}
          balance={confirm.balance}
          flow={boosting.flow}
          error={boosting.error}
          capReached={capReached}
          onConfirm={() => void boosting.submit()}
          onClose={closeConfirm}
        />
      ) : null}

      {toRemove ? (
        <RemoveBoostModal
          serverName={server.name}
          boost={toRemove}
          boostCount={summary.boost_count}
          pending={removing.pending}
          error={removing.error}
          onConfirm={() => void confirmRemove()}
          onClose={closeRemove}
        />
      ) : null}
    </div>
  );
}
