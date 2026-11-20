import {
  BILLING_COPY,
  DEFAULT_PAGE_SIZE,
  formatBillingDate,
  formatPointsDelta,
  LEDGER_REASON_LABELS,
  type LedgerEntry,
  type ServerSummary,
} from "@discordia/client-shared";
import { Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/cn";

import { DiscordiaPointIcon } from "../icons/DiscordiaIcons";
import { EmptyHistory } from "./EmptyHistory";
import { HistoryPagination } from "./HistoryPagination";
import { usePagedItems } from "../hooks/usePagedItems";

interface PointMovementsProps {
  ledger: LedgerEntry[];
  serverDirectory: Map<string, ServerSummary> | null;
}

export function PointMovements({
  ledger,
  serverDirectory,
}: PointMovementsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [serverFilter, setServerFilter] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const serversInLedger = useMemo(() => {
    const list: { id: string; name: string }[] = [];
    const seen = new Set<string>();
    for (const entry of ledger) {
      if (entry.server_id && !seen.has(entry.server_id)) {
        seen.add(entry.server_id);
        const name =
          serverDirectory?.get(entry.server_id)?.name ?? "Servidor desconocido";
        list.push({ id: entry.server_id, name });
      }
    }
    return list;
  }, [ledger, serverDirectory]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const matchingServers = useMemo(() => {
    if (!searchQuery.trim()) return serversInLedger;
    const q = searchQuery.toLowerCase();
    return serversInLedger.filter((s) => s.name.toLowerCase().includes(q));
  }, [serversInLedger, searchQuery]);

  const filteredLedger = useMemo(() => {
    if (serverFilter !== null) {
      return ledger.filter((entry) => entry.server_id === serverFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return ledger.filter((entry) => {
        if (!entry.server_id) return false;
        const name =
          serverDirectory?.get(entry.server_id)?.name ?? "Servidor desconocido";
        return name.toLowerCase().includes(q);
      });
    }
    return ledger;
  }, [ledger, serverFilter, searchQuery, serverDirectory]);

  const paged = usePagedItems(filteredLedger, DEFAULT_PAGE_SIZE);

  const handleSelectServer = (serverId: string, serverName: string) => {
    setServerFilter(serverId);
    setSearchQuery(serverName);
    setIsDropdownOpen(false);
    paged.setPage(1);
  };

  const handleClearFilter = () => {
    setServerFilter(null);
    setSearchQuery("");
    setIsDropdownOpen(false);
    paged.setPage(1);
  };

  return (
    <section>
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="font-display text-content text-base font-bold">
            {BILLING_COPY.movementsTitle}
          </h4>
          <p className="text-content-subtle mt-1 text-xs">
            {BILLING_COPY.movementsSubtitle}
          </p>
        </div>

        {serversInLedger.length > 0 ? (
          <div
            ref={dropdownRef}
            className="relative w-full sm:w-64 sm:shrink-0"
          >
            <div className="bg-surface-input border-line focus-within:border-accent flex items-center gap-2.5 rounded-xl border px-3 py-1.5 transition-colors">
              <Search
                size={14}
                className="text-content-subtle shrink-0"
                aria-hidden="true"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setServerFilter(null);
                  setIsDropdownOpen(true);
                  paged.setPage(1);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                placeholder="Buscar por servidor..."
                className="text-content placeholder:text-content-subtle min-w-0 flex-1 bg-transparent text-xs outline-none"
              />
              {searchQuery || serverFilter ? (
                <button
                  type="button"
                  onClick={handleClearFilter}
                  aria-label="Limpiar filtro de servidor"
                  className="text-content-subtle hover:text-content flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors"
                >
                  <X size={12} />
                </button>
              ) : null}
            </div>

            {isDropdownOpen ? (
              <div className="bg-surface-raised border-line-strong absolute top-full right-0 z-50 mt-1.5 max-h-52 w-full overflow-y-auto rounded-xl border shadow-xl">
                {serverFilter !== null || searchQuery ? (
                  <button
                    type="button"
                    onClick={handleClearFilter}
                    className="hover:bg-surface-hover border-line text-content-subtle hover:text-content flex w-full cursor-pointer items-center border-b px-3.5 py-2 text-left text-xs font-semibold transition-colors"
                  >
                    Todos los servidores
                  </button>
                ) : null}
                {matchingServers.length === 0 ? (
                  <p className="text-content-subtle px-3.5 py-2.5 text-center text-xs">
                    No se encontraron servidores
                  </p>
                ) : (
                  matchingServers.map((server) => {
                    const isSelected = serverFilter === server.id;
                    return (
                      <button
                        key={server.id}
                        type="button"
                        onClick={() =>
                          handleSelectServer(server.id, server.name)
                        }
                        className={cn(
                          "hover:bg-surface-hover flex w-full cursor-pointer items-center justify-between px-3.5 py-2 text-left text-xs transition-colors",
                          isSelected
                            ? "bg-accent/15 text-accent font-semibold"
                            : "text-content",
                        )}
                      >
                        <span className="truncate">{server.name}</span>
                        {isSelected ? (
                          <span className="text-accent text-[11px] font-bold">
                            Seleccionado
                          </span>
                        ) : null}
                      </button>
                    );
                  })
                )}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {filteredLedger.length === 0 ? (
        <EmptyHistory text={BILLING_COPY.movementsEmpty} />
      ) : (
        <ul className="border-line divide-line divide-y overflow-hidden rounded-2xl border">
          {paged.pageItems.map((entry, index) => {
            const serverName = entry.server_id
              ? (serverDirectory?.get(entry.server_id)?.name ??
                "Servidor desconocido")
              : null;

            return (
              <li
                key={`${entry.created_at}-${index}`}
                className="bg-surface-raised flex items-center gap-3 px-4 py-3"
              >
                <DiscordiaPointIcon size={18} className="shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="font-display text-content text-sm font-semibold">
                    {LEDGER_REASON_LABELS[entry.reason]}
                  </div>
                  <div className="text-content-subtle text-[11px]">
                    {formatBillingDate(entry.created_at)}
                  </div>
                  {serverName ? (
                    <div className="text-content-subtle truncate text-[11px]">
                      {serverName}
                    </div>
                  ) : null}
                </div>
                <span
                  className={cn(
                    "font-display text-sm font-bold tabular-nums",
                    entry.delta >= 0 ? "text-success" : "text-danger",
                  )}
                >
                  {formatPointsDelta(entry.delta)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      <HistoryPagination
        page={paged.page}
        pageCount={paged.pageCount}
        range={paged.range}
        total={paged.total}
        noun="movimientos"
        onPageChange={paged.setPage}
      />
    </section>
  );
}
