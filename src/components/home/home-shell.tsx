"use client";

import { Home as HomeIcon, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/home/empty-state";
import { JoinServerModal } from "@/components/invites/join-server-modal";
import { OwnProfileModal } from "@/components/profile/own-profile-modal";
import { UserPanel } from "@/components/profile/user-panel";
import { CreateServerModal } from "@/components/servers/create-server-modal";
import { ServerView } from "@/components/servers/server-view";
import { ServerAvatar } from "@/components/ui/server-avatar";
import { useAuth } from "@/services/auth/auth-context";
import { getOwnProfileRequest } from "@/services/profile/client";
import type { User } from "@/types/auth.types";
import type { ServerSummary } from "@/types/server.types";
import { cn } from "@/lib/cn";
import { ROUTES } from "@/lib/constants";

interface HomeShellProps {
  initialServers: ServerSummary[];
  initialSelectedServerId?: string | null;
}

export function HomeShell({
  initialServers,
  initialSelectedServerId = null,
}: HomeShellProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [servers, setServers] = useState<ServerSummary[]>(initialServers);
  const [selectedServerId, setSelectedServerId] = useState<string | null>(
    initialSelectedServerId,
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [ownProfile, setOwnProfile] = useState<User | null>(null);
  const [isOwnProfileOpen, setIsOwnProfileOpen] = useState(false);
  const selectedServer =
    servers.find((server) => server.id === selectedServerId) ?? null;

  // Perfil propio: se pide una sola vez aca (no en `ServerView`) para no
  // refetchear cada vez que se cambia de servidor, y para que el panel de
  // usuario este disponible incluso sin servidor seleccionado.
  useEffect(() => {
    let cancelled = false;
    getOwnProfileRequest().then((result) => {
      if (!cancelled && result.ok) setOwnProfile(result.user);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // `?server=...` solo sirve para el estado inicial (arriba, al volver de
  // aceptar una invitacion); lo sacamos de la URL para que un refresh no
  // vuelva a "reseleccionar" el mismo server por las dudas.
  useEffect(() => {
    if (initialSelectedServerId !== null) {
      router.replace(ROUTES.home);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addAndSelect(server: ServerSummary) {
    setServers((prev) => {
      const withoutDuplicate = prev.filter(
        (existing) => existing.id !== server.id,
      );
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

  function updateServer(server: ServerSummary) {
    setServers((prev) =>
      prev.map((existing) => (existing.id === server.id ? server : existing)),
    );
  }

  return (
    <div
      className="flex h-dvh w-full overflow-hidden"
      style={{ background: "var(--bg-chat)" }}
    >
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
            "flex size-12 cursor-pointer items-center justify-center rounded-2xl transition-all",
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
                className="cursor-pointer overflow-hidden rounded-2xl"
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
          className="bg-surface-input text-success hover:bg-success/15 flex size-12 cursor-pointer items-center justify-center rounded-full transition-all hover:rounded-2xl"
        >
          <Plus size={22} />
        </button>
      </div>

      {/* Main panel */}
      {selectedServer ? (
        <ServerView
          key={selectedServer.id}
          server={selectedServer}
          onLeft={() => removeServer(selectedServer.id)}
          onServerUpdate={updateServer}
          ownProfile={ownProfile}
          onOpenOwnProfile={() => setIsOwnProfileOpen(true)}
        />
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Home sidebar: mismo ancho/columna que el sidebar de canales de
              ServerView, para que el panel de usuario viva siempre en el
              mismo lugar tenga o no un servidor seleccionado. */}
          <div
            className="flex w-60 shrink-0 flex-col overflow-hidden"
            style={{ background: "var(--bg-channels)" }}
          >
            <div className="border-line flex h-12 shrink-0 items-center gap-2 border-b px-4">
              <HomeIcon size={16} className="text-content-subtle" />
              <span className="font-display text-content text-sm font-semibold">
                Inicio
              </span>
            </div>

            <div className="flex-1" />

            {ownProfile ? (
              <UserPanel
                user={ownProfile}
                onClick={() => setIsOwnProfileOpen(true)}
              />
            ) : null}
          </div>

          <div
            className="flex flex-1 flex-col overflow-hidden"
            style={{ background: "var(--bg-chat)" }}
          >
            {servers.length > 0 ? (
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
          </div>
        </div>
      )}

      {isCreateModalOpen ? (
        <CreateServerModal
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={addAndSelect}
          onJoinClick={() => {
            setIsCreateModalOpen(false);
            setIsJoinModalOpen(true);
          }}
        />
      ) : null}

      {isJoinModalOpen ? (
        <JoinServerModal
          onClose={() => setIsJoinModalOpen(false)}
          onJoined={addAndSelect}
        />
      ) : null}

      {isOwnProfileOpen && ownProfile ? (
        <OwnProfileModal
          serverId={selectedServer?.id}
          profile={ownProfile}
          onClose={() => setIsOwnProfileOpen(false)}
          onUpdated={setOwnProfile}
        />
      ) : null}
    </div>
  );
}
