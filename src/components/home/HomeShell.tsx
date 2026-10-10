"use client";

import {
  messageAuthorOf,
  type PublicUser,
  type ServerSummary,
  type User,
} from "@discordia/client-shared";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { DirectMessagesView } from "@/components/direct-messages/DirectMessagesView";
import { HomeView } from "@/components/home/HomeView";
import { LoadingScreen } from "@/components/home/LoadingScreen";
import { ServerRail } from "@/components/home/ServerRail";
import { JoinServerModal } from "@/components/invites/JoinServerModal";
import { DrawerBackdrop } from "@/components/layout/DrawerBackdrop";
import { MobilePanelsProvider } from "@/components/layout/MobilePanelsContext";
import { OwnProfileModal } from "@/components/profile/OwnProfileModal";
import { CreateServerModal } from "@/components/servers/CreateServerModal";
import { ServerView } from "@/components/servers/ServerView";
import { useLoadingGate } from "@/hooks/useLoadingGate";
import { useAuth } from "@/services/auth/AuthContext";
import { BlockedUsersProvider } from "@/services/blocks/BlockedUsersContext";
import { useDirectMessages } from "@/services/conversations/useDirectMessages";
import { useMentions } from "@/services/mentions/useMentions";
import { authorFromProfile } from "@/services/messages/author";
import { getOwnProfileRequest } from "@/services/profile/client";
import { listServersRequest } from "@/services/servers/client";
import { avatarSrcOf } from "@/lib/userProfile";
import { ROUTES } from "@/lib/constants";
import { readLastLocation, writeLastLocation } from "@/lib/lastLocation";

type MainView = "servers" | "direct-messages";

interface HomeShellProps {
  initialServers: ServerSummary[];
  initialSelectedServerId?: string | null;
}

function HomeShellContent({
  initialServers,
  initialSelectedServerId = null,
}: HomeShellProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [servers, setServers] = useState<ServerSummary[]>(initialServers);
  const [selectedServerId, setSelectedServerId] = useState<string | null>(
    initialSelectedServerId,
  );
  // Se entra en Mensajes Directos: si no, el login cae en "Inicio" sin lista y
  // parece que los DMs no funcionan. Venir de una invitacion abre el servidor.
  const [view, setView] = useState<MainView>(
    initialSelectedServerId ? "servers" : "direct-messages",
  );
  const [lastChannelId, setLastChannelId] = useState<string | null>(null);
  const [isRestored, setIsRestored] = useState(
    initialSelectedServerId !== null,
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [ownProfile, setOwnProfile] = useState<User | null>(null);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);
  const [areServersLoaded, setAreServersLoaded] = useState(false);
  const [isOwnProfileOpen, setIsOwnProfileOpen] = useState(false);
  const selectedServer =
    servers.find((server) => server.id === selectedServerId) ?? null;

  // Se pide una sola vez y sobrevive a cambiar de vista, asi el contador de
  // no leidos del riel no se resetea al entrar y salir de Mensajes Directos.
  const currentAuthor = useMemo(
    () => (ownProfile ? authorFromProfile(ownProfile) : null),
    [ownProfile],
  );
  const mentions = useMentions(currentAuthor?.id ?? null);
  const directMessages = useDirectMessages(
    currentAuthor,
    view === "direct-messages",
    { onMention: mentions.receive, onRejoined: mentions.reload },
  );
  const unreadDmCount = directMessages.conversations.filter(
    (c) => c.isUnread,
  ).length;

  // Al recargar se vuelve a donde se estaba (servidor + canal, o un DM). Se lee
  // despues de montar porque localStorage no existe en el render del servidor.
  const userId = user ? String(user.id) : null;
  const openConversation = directMessages.openConversation;
  useEffect(() => {
    if (isRestored || !userId) return;
    const stored = readLastLocation(userId);
    if (stored?.view === "servers" && stored.serverId) {
      if (initialServers.some((server) => server.id === stored.serverId)) {
        setView("servers");
        setSelectedServerId(stored.serverId);
        setLastChannelId(stored.channelId);
      }
    } else if (stored?.partnerId) {
      openConversation(stored.partnerId);
    }
    setIsRestored(true);
  }, [isRestored, userId, initialServers, openConversation]);

  const activePartnerId = directMessages.activeSummary?.partner.id ?? null;
  useEffect(() => {
    if (!isRestored || !userId) return;
    writeLastLocation(userId, {
      view,
      serverId: selectedServerId,
      channelId: view === "servers" ? lastChannelId : null,
      partnerId: activePartnerId,
    });
  }, [
    isRestored,
    userId,
    view,
    selectedServerId,
    lastChannelId,
    activePartnerId,
  ]);

  // Perfil propio: se pide una sola vez aca (no en `ServerView`) para no
  // refetchear cada vez que se cambia de servidor, y para que el panel de
  // usuario este disponible incluso sin servidor seleccionado.
  useEffect(() => {
    let cancelled = false;
    getOwnProfileRequest().then((result) => {
      if (cancelled) return;
      if (result.ok) setOwnProfile(result.user);
      setIsProfileLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    listServersRequest().then((result) => {
      if (cancelled) return;
      if (result.ok) setServers(result.servers);
      setAreServersLoaded(true);
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

  const isReady =
    isProfileLoaded &&
    areServersLoaded &&
    (!currentAuthor || (mentions.isLoaded && !directMessages.isLoading));
  const gate = useLoadingGate(isReady);
  if (gate === "waiting") {
    return (
      <div className="h-dvh w-full" style={{ background: "var(--bg-chat)" }} />
    );
  }
  if (gate === "loading" || gate === "leaving") {
    return <LoadingScreen isLeaving={gate === "leaving"} />;
  }

  function messageUser(profile: PublicUser) {
    directMessages.openConversation(
      profile.id,
      messageAuthorOf(
        profile.id,
        profile.name,
        avatarSrcOf(profile.id, profile),
      ),
    );
    setView("direct-messages");
  }

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
    <MobilePanelsProvider>
      <div
        className="relative flex h-dvh w-full overflow-hidden"
        style={{ background: "var(--bg-chat)" }}
      >
        <ServerRail
          servers={servers}
          selectedServerId={selectedServerId}
          isDirectMessagesActive={view === "direct-messages"}
          unreadDmCount={unreadDmCount}
          unreadMentionsByServer={mentions.byServer}
          onSelect={(serverId) => {
            setView("servers");
            setSelectedServerId(serverId);
            setLastChannelId(null);
          }}
          onOpenDirectMessages={() => setView("direct-messages")}
          onCreateClick={() => setIsCreateModalOpen(true)}
        />

        {!isRestored ? null : view === "direct-messages" ? (
          <DirectMessagesView
            currentAuthor={currentAuthor}
            ownProfile={ownProfile}
            onOpenOwnProfile={() => setIsOwnProfileOpen(true)}
            servers={servers}
            directMessages={directMessages}
          />
        ) : selectedServer ? (
          <ServerView
            key={selectedServer.id}
            server={selectedServer}
            onLeft={() => removeServer(selectedServer.id)}
            onServerUpdate={updateServer}
            ownProfile={ownProfile}
            onOpenOwnProfile={() => setIsOwnProfileOpen(true)}
            onMessageUser={messageUser}
            unreadMentionsByChannel={mentions.byChannel}
            onChannelRead={mentions.markChannelRead}
            initialChannelId={lastChannelId}
            onChannelChange={setLastChannelId}
          />
        ) : (
          <HomeView
            hasServers={servers.length > 0}
            userName={user?.name}
            ownProfile={ownProfile}
            onOpenOwnProfile={() => setIsOwnProfileOpen(true)}
            onCreateClick={() => setIsCreateModalOpen(true)}
            onJoinClick={() => setIsJoinModalOpen(true)}
          />
        )}

        <DrawerBackdrop />

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
    </MobilePanelsProvider>
  );
}

export function HomeShell(props: HomeShellProps) {
  return (
    <BlockedUsersProvider>
      <HomeShellContent {...props} />
    </BlockedUsersProvider>
  );
}
