"use client";

import { Home as HomeIcon, Plus } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/home/empty-state";
import { CreateServerModal } from "@/components/servers/create-server-modal";
import { JoinServerModal } from "@/components/servers/join-server-modal";
import { ServerAvatar } from "@/components/servers/server-avatar";
import { ServerView } from "@/components/servers/server-view";
import { useAuth } from "@/features/auth/auth-context";
import type { ServerListItem, ServerSummary } from "@/features/servers/types";
import { cn } from "@/lib/cn";

interface HomeShellProps {
  initialServers: ServerSummary[];
}

export function HomeShell({ initialServers }: HomeShellProps) {
  const { user, logout, isLoggingOut } = useAuth();
  // Los servers que ya existian al cargar la pagina no tienen forma de saber
  // si su icono es uno que el usuario eligio o el default que genera el back
  // -- arrancan en `hasCustomIcon: false` (ver features/servers/types.ts).
  const [servers, setServers] = useState<ServerListItem[]>(() =>
    initialServers.map((server) => ({ ...server, hasCustomIcon: false })),
  );
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const selectedServer = servers.find((server) => server.id === selectedServerId) ?? null;

  function addAndSelect(server: ServerSummary, hasCustomIcon: boolean) {
    setServers((prev) => {
      const withoutDuplicate = prev.filter((existing) => existing.id !== server.id);
      return [...withoutDuplicate, { ...server, hasCustomIcon }];
    });
    setSelectedServerId(server.id);
    setIsCreateModalOpen(false);
    setIsJoinModalOpen(false);
  }

  return (
    <div className="flex h-dvh w-full overflow-hidden" style={{ background: "var(--bg-chat)" }}>
      {/* Server rail */}
      <div
        className="flex w-[72px] shrink-0 flex-col items-center gap-2 overflow-y-auto py-3"
        style={{ background: "var(--bg-servers)" }}
      >
        <button
          type="button"
          onClick={() => setSelectedServerId(null)}
          aria-label="Inicio"
          className={cn(
            "flex size-12 items-center justify-center rounded-2xl transition-all",
            selectedServerId === null
              ? "bg-accent text-white"
              : "bg-surface-input text-content-muted hover:bg-accent/30",
          )}
        >
          <HomeIcon size={20} />
        </button>

        <div className="bg-line-strong h-px w-8 rounded-full" />

        {servers.map((server) => {
          const active = server.id === selectedServerId;
          return (
            <div key={server.id} className="relative">
              {active ? (
                <div className="bg-accent absolute top-1/2 -left-2 h-8 w-1 -translate-y-1/2 rounded-r-full" />
              ) : null}
              <button
                type="button"
                title={server.name}
                onClick={() => setSelectedServerId(server.id)}
                className={cn(
                  "overflow-hidden transition-all",
                  active ? "rounded-2xl" : "rounded-full hover:rounded-2xl",
                )}
              >
                <ServerAvatar
                  name={server.name}
                  src={server.hasCustomIcon ? `/api/servers/${server.id}/icon` : null}
                  size={48}
                />
              </button>
            </div>
          );
        })}

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          aria-label="Crear servidor"
          className="bg-surface-input text-success hover:bg-success/15 flex size-12 items-center justify-center rounded-full transition-all hover:rounded-2xl"
        >
          <Plus size={22} />
        </button>

        <button
          type="button"
          onClick={logout}
          disabled={isLoggingOut}
          className="text-content-subtle hover:text-danger mt-auto text-[10px] font-semibold tracking-wider uppercase disabled:opacity-50"
        >
          Salir
        </button>
      </div>

      {/* Main panel */}
      {selectedServer ? (
        <ServerView key={selectedServer.id} server={selectedServer} />
      ) : servers.length > 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="font-display text-content-subtle text-sm font-semibold tracking-wider uppercase">
            Tus servidores
          </p>
          <h1 className="font-display text-content text-2xl font-bold">
            Elegí un servidor de la barra lateral
          </h1>
          <p className="text-content-muted max-w-sm text-sm leading-relaxed">
            O sumá uno nuevo con el botón de abajo.
          </p>
        </div>
      ) : (
        <EmptyState
          userName={user?.name}
          onCreateClick={() => setIsCreateModalOpen(true)}
          onJoinClick={() => setIsJoinModalOpen(true)}
        />
      )}

      {isCreateModalOpen ? (
        <CreateServerModal onClose={() => setIsCreateModalOpen(false)} onCreated={addAndSelect} />
      ) : null}

      {isJoinModalOpen ? (
        <JoinServerModal
          onClose={() => setIsJoinModalOpen(false)}
          onJoined={(server) => addAndSelect(server, false)}
        />
      ) : null}
    </div>
  );
}
