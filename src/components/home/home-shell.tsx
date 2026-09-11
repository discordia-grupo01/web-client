"use client";

import { Home as HomeIcon, Plus } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/home/empty-state";
import { CreateServerModal } from "@/components/servers/create-server-modal";
import { JoinServerModal } from "@/components/servers/join-server-modal";
import { ServerAvatar } from "@/components/servers/server-avatar";
import { ServerView } from "@/components/servers/server-view";
import { useAuth } from "@/features/auth/auth-context";
import type { ServerSummary } from "@/features/servers/types";
import { cn } from "@/lib/cn";

interface HomeShellProps {
  initialServers: ServerSummary[];
}

export function HomeShell({ initialServers }: HomeShellProps) {
  const { user, logout, isLoggingOut } = useAuth();
  const [servers, setServers] = useState<ServerSummary[]>(initialServers);
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const selectedServer = servers.find((server) => server.id === selectedServerId) ?? null;

  function addAndSelect(server: ServerSummary) {
    setServers((prev) => {
      const withoutDuplicate = prev.filter((existing) => existing.id !== server.id);
      return [...withoutDuplicate, server];
    });
    setSelectedServerId(server.id);
    setIsCreateModalOpen(false);
    setIsJoinModalOpen(false);
  }

  function removeServer(serverId: string) {
    setServers((prev) => prev.filter((server) => server.id !== serverId));
    setSelectedServerId((prev) => (prev === serverId ? null : prev));
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
                className="overflow-hidden rounded-2xl"
              >
                <ServerAvatar
                  name={server.name}
                  src={`/api/servers/${server.id}/icon`}
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
        <ServerView
          key={selectedServer.id}
          server={selectedServer}
          onLeft={() => removeServer(selectedServer.id)}
        />
      ) : servers.length > 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="font-display text-content-subtle text-sm font-semibold tracking-wider uppercase">
            Tus servidores
          </p>
          <h1 className="font-display text-content text-2xl font-bold">
            Elegí un servidor de la barra lateral
          </h1>
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
        <JoinServerModal onClose={() => setIsJoinModalOpen(false)} onJoined={addAndSelect} />
      ) : null}
    </div>
  );
}
