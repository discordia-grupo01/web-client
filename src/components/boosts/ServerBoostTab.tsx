"use client";

import {
  activeBoostCount,
  type Boost,
  RETRY_LABEL,
  type ServerBoostSummary,
  type ServerSummary,
  serverBoosts,
} from "@discordia/client-shared";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { FormAlert } from "@/components/ui/FormAlert";

import { BoostActionCard } from "./actions/BoostActionCard";
import { BoostConfirmModal } from "./actions/BoostConfirmModal";
import { BoostStatusCard } from "./status/BoostStatusCard";
import { useBoostServer } from "./hooks/useBoostServer";
import type { OwnBoosts } from "./hooks/useOwnBoosts";
import { useRemoveBoost } from "./hooks/useRemoveBoost";
import { RemoveBoostModal } from "./actions/RemoveBoostModal";
import { ServerBoostList } from "./actions/ServerBoostList";

interface ServerBoostTabProps {
  server: ServerSummary;
  summary: ServerBoostSummary;
  /** Se pide en la sección, a la par del resumen, para no esperar uno detrás del otro. */
  own: OwnBoosts;
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
  own,
  onSummaryStale,
  onBuyPoints,
}: ServerBoostTabProps) {
  const boosting = useBoostServer(server.id);
  const removing = useRemoveBoost(own.replaceBoost);
  const [confirm, setConfirm] = useState<ConfirmSnapshot | null>(null);
  const [toRemove, setToRemove] = useState<Boost | null>(null);

  const finished = boosting.flow.phase === "done";
  const { reload } = own;
  useEffect(() => {
    // Al terminar no se espera solo al socket: se piden el nivel, la lista y el saldo.
    if (!finished) return;
    onSummaryStale();
    void reload();
  }, [finished, onSummaryStale, reload]);

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

      {own.state.status === "error" ? (
        <div className="space-y-3">
          <FormAlert message={own.state.message} />
          <Button
            type="button"
            variant="secondary"
            onClick={() => void own.reload()}
          >
            {RETRY_LABEL}
          </Button>
        </div>
      ) : own.state.status === "loading" ? (
        <p className="text-content-subtle text-sm">Cargando…</p>
      ) : (
        <>
          <BoostActionCard
            balance={own.state.balance}
            onBoost={() =>
              own.state.status === "ready" && openConfirm(own.state.balance)
            }
            onBuyPoints={onBuyPoints}
          />
          <ServerBoostList
            boosts={serverBoosts(own.state.boosts, server.id)}
            activeCount={activeBoostCount(own.state.boosts, server.id)}
            onRemove={setToRemove}
          />
        </>
      )}

      {confirm ? (
        <BoostConfirmModal
          serverName={server.name}
          boostCount={confirm.boostCount}
          balance={confirm.balance}
          flow={boosting.flow}
          error={boosting.error}
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
