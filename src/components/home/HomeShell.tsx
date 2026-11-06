"use client";

import {
  type MessageAuthor,
  messageAuthorOf,
  type NotificationHistoryItem,
  type PublicUser,
  type ServerSummary,
} from "@discordia/client-shared";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { DirectMessagesView } from "@/components/direct-messages/DirectMessagesView";
import { useCallPartnerResolver } from "@/components/private-call/hooks/useCallPartnerResolver";
import { PrivateCallBanner } from "@/components/private-call/PrivateCallBanner";
import { PrivateCallDialog } from "@/components/private-call/PrivateCallDialog";
import { PrivateCallNotice } from "@/components/private-call/PrivateCallNotice";
import { PrivateCallProvider } from "@/contexts/PrivateCallContext";
import { HomeView } from "@/components/home/HomeView";
import { LoadingScreen } from "@/components/home/LoadingScreen";
import { ServerRail } from "@/components/home/ServerRail";
import { JoinServerModal } from "@/components/invites/JoinServerModal";
import { DrawerBackdrop } from "@/components/layout/DrawerBackdrop";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { MobilePanelsProvider } from "@/contexts/MobilePanelsContext";
import {
  type NotificationsValue,
  NotificationsProvider,
} from "@/contexts/NotificationsContext";
import {
  NotificationSettingsProvider,
  useOptionalNotificationSettings,
} from "@/contexts/NotificationSettingsContext";
import { useNotificationHistory } from "@/hooks/useNotificationHistory";
import { usePushDeviceSync } from "@/hooks/usePushNotifications";
import { useNotificationRefreshOnSignal } from "@/hooks/useNotificationRefreshOnSignal";
import { useNotificationReads } from "@/hooks/useNotificationReads";
import { OwnProfileModal } from "@/components/profile/OwnProfileModal";
import { OwnProfileProvider } from "@/contexts/OwnProfileContext";
import { useOwnProfile } from "@/hooks/useOwnProfile";
import { CreateServerModal } from "@/components/servers/create/CreateServerModal";
import { ServerView } from "@/components/servers/ServerView";
import { useLoadingGate } from "@/components/home/hooks/useLoadingGate";
import { useAuth } from "@/contexts/AuthContext";
import { BlockedUsersProvider } from "@/contexts/BlockedUsersContext";
import {
  useVoiceSession,
  VoiceSessionProvider,
} from "@/contexts/VoiceSessionContext";
import { useDirectMessages } from "@/hooks/useDirectMessages";
import { PresenceProvider } from "@/contexts/PresenceContext";
import { PlatformStatusNotice } from "@/components/platform-status/PlatformStatusNotice";
import { useIdleReporter } from "@/components/home/hooks/useIdleReporter";
import { useLoadPresence } from "@/hooks/useLoadPresence";
import {
  usePresenceProviderValue,
  usePresenceSession,
} from "@/components/home/hooks/usePresenceSession";
import { useMentions } from "@/components/home/hooks/useMentions";
import { useUnreadState } from "@/components/home/hooks/useUnreadState";
import { authorFromProfile } from "@/utils/author";
import { listServersRequest } from "@/services/servers/client";
import { avatarSrcOf } from "@/utils/userProfile";
import { ROUTES } from "@/lib/constants";
import {
  readLastLocation,
  writeLastLocation,
} from "@/components/home/utils/lastLocation";

type MainView = "servers" | "direct-messages";

const NOTIFICATIONS_POLL_INTERVAL_MS = 30_000;

function latestIncomingDirectMessageId(
  conversations: readonly {
    lastMessage: { id: string; user_id: string; inserted_at: string } | null;
  }[],
  currentUserId: string | null,
): string | null {
  let latest: { id: string; at: number } | null = null;
  for (const { lastMessage: message } of conversations) {
    if (!message || message.user_id === currentUserId) continue;
    const at = Date.parse(message.inserted_at);
    if (latest === null || at > latest.at) latest = { id: message.id, at };
  }
  return latest?.id ?? null;
}

interface HomeShellProps {
  initialServers: ServerSummary[];
  initialSelectedServerId?: string | null;
  initialChannelId?: string | null;
  initialPartnerId?: string | null;
}

function HomeShellContent({
  initialServers,
  initialSelectedServerId = null,
  initialChannelId = null,
  initialPartnerId = null,
}: HomeShellProps) {
  const router = useRouter();
  const { user } = useAuth();
  usePushDeviceSync(user ? String(user.id) : null);
  const [servers, setServers] = useState<ServerSummary[]>(initialServers);
  const [selectedServerId, setSelectedServerId] = useState<string | null>(
    initialSelectedServerId,
  );
  const [view, setView] = useState<MainView>(
    initialSelectedServerId ? "servers" : "direct-messages",
  );
  const [lastChannelId, setLastChannelId] = useState<string | null>(
    initialSelectedServerId !== null ? initialChannelId : null,
  );
  const [isRestored, setIsRestored] = useState(
    initialSelectedServerId !== null || initialPartnerId !== null,
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsAnchorRef = useRef<HTMLDivElement>(null);
  const [serverViewNonce, setServerViewNonce] = useState(0);
  const [notificationsSignal, setNotificationsSignal] = useState(0);

  const {
    profile: ownProfile,
    setProfile: setOwnProfile,
    isLoaded: isProfileLoaded,
    refresh: refreshOwnProfile,
  } = useOwnProfile();
  const [areServersLoaded, setAreServersLoaded] = useState(false);
  const [ownProfileServerId, setOwnProfileServerId] = useState<
    string | null | undefined
  >(undefined);
  const selectedServer =
    servers.find((server) => server.id === selectedServerId) ?? null;

  const voice = useVoiceSession();
  const voiceFocus = voice.state.focus;
  useEffect(() => {
    if (!voiceFocus) return;
    setView("servers");
    setSelectedServerId(voiceFocus.serverId);
    setLastChannelId(voiceFocus.channelId);
  }, [voiceFocus]);

  function removeServer(serverId: string) {
    const { target } = voice.state;
    if (target?.kind === "channel" && target.serverId === serverId) {
      voice.leave();
    }
    setServers((prev) => prev.filter((server) => server.id !== serverId));
    setSelectedServerId((prev) => (prev === serverId ? null : prev));
  }

  function reloadServers() {
    void listServersRequest().then((result) => {
      if (result.ok) setServers(result.servers);
    });
  }

  // Se pide una sola vez y sobrevive a cambiar de vista, asi el contador de
  // no leidos del riel no se resetea al entrar y salir de Mensajes Directos.
  const currentAuthor = useMemo(
    () => (ownProfile ? authorFromProfile(ownProfile) : null),
    [ownProfile],
  );
  const notificationSettings = useOptionalNotificationSettings();
  const mentions = useMentions(
    currentAuthor?.id ?? null,
    notificationSettings?.settings,
  );
  const presence = usePresenceSession(currentAuthor?.id ?? null);
  const directMessages = useDirectMessages(
    currentAuthor,
    view === "direct-messages",
    {
      onMention: (payload) => {
        mentions.receive(payload);
        setNotificationsSignal((signal) => signal + 1);
      },
      onRejoined: () => {
        mentions.reload();
        reloadServers();
      },
      onServerLeft: ({ server_id }) => {
        if (view === "servers" && selectedServerId === server_id) {
          setView("direct-messages");
        }
        removeServer(server_id);
      },
      ...presence.userRoomCallbacks,
    },
  );
  const resolveCallPartner = useCallPartnerResolver(
    directMessages.conversations,
  );
  const presenceValue = usePresenceProviderValue(
    presence.store,
    directMessages.pushToUserRoom,
  );
  useIdleReporter(presence.store, directMessages.pushToUserRoom);
  useLoadPresence(
    presence.store,
    directMessages.conversations.map((c) => c.partner.id),
  );
  const unreadDmCount = directMessages.conversations.filter(
    (c) => c.isUnread,
  ).length;

  const notificationHistory = useNotificationHistory();
  const unreadByConversation = useMemo(
    () =>
      new Map(
        directMessages.conversations.flatMap((conversation) =>
          conversation.conversationId
            ? [[conversation.conversationId, conversation.isUnread] as const]
            : [],
        ),
      ),
    [directMessages.conversations],
  );
  const { isLoaded: areMentionsLoaded, isUnread: isMentionUnread } = mentions;
  const isDirectMessagesLoading = directMessages.isLoading;
  const isUnreadInMessaging = useCallback(
    (item: NotificationHistoryItem) => {
      if (item.kind === "mention") {
        return !areMentionsLoaded || isMentionUnread(item.message_id);
      }
      if (isDirectMessagesLoading) return true;
      return unreadByConversation.get(item.conversation_id ?? "") ?? true;
    },
    [
      areMentionsLoaded,
      isMentionUnread,
      isDirectMessagesLoading,
      unreadByConversation,
    ],
  );
  const notificationReads = useNotificationReads(
    currentAuthor?.id ?? null,
    notificationHistory.items,
    isUnreadInMessaging,
  );
  const refreshNotificationsRef = useRef(notificationHistory.refresh);
  useEffect(() => {
    refreshNotificationsRef.current = notificationHistory.refresh;
  }, [notificationHistory.refresh]);

  useNotificationRefreshOnSignal(
    notificationsSignal,
    notificationHistory.refresh,
  );

  const latestIncomingDmId = useMemo(
    () =>
      latestIncomingDirectMessageId(
        directMessages.conversations,
        currentAuthor?.id ?? null,
      ),
    [directMessages.conversations, currentAuthor?.id],
  );
  const knownIncomingDmId = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (directMessages.isLoading) return;
    if (knownIncomingDmId.current === undefined) {
      knownIncomingDmId.current = latestIncomingDmId;
      return;
    }
    if (
      latestIncomingDmId &&
      latestIncomingDmId !== knownIncomingDmId.current
    ) {
      knownIncomingDmId.current = latestIncomingDmId;
      setNotificationsSignal((signal) => signal + 1);
    }
  }, [directMessages.isLoading, latestIncomingDmId]);

  useEffect(() => {
    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") {
        void refreshNotificationsRef.current();
      }
    };
    const interval = window.setInterval(
      refreshIfVisible,
      NOTIFICATIONS_POLL_INTERVAL_MS,
    );
    document.addEventListener("visibilitychange", refreshIfVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshIfVisible);
    };
  }, []);

  const openChannelId =
    view === "servers" && selectedServerId ? lastChannelId : null;
  const unread = useUnreadState(currentAuthor?.id ?? null, openChannelId);
  const openChannelMentions = openChannelId
    ? (mentions.byChannel[openChannelId] ?? 0)
    : 0;
  const { markChannelRead: markChannelMentionsRead } = mentions;
  useEffect(() => {
    if (openChannelId && openChannelMentions > 0) {
      markChannelMentionsRead(openChannelId);
    }
  }, [openChannelId, openChannelMentions, markChannelMentionsRead]);

  const {
    markChannelRead: markNotificationChannelRead,
    markConversationRead: markNotificationConversationRead,
  } = notificationReads;
  const openedConversationId =
    view === "direct-messages"
      ? (directMessages.activeSummary?.conversationId ?? null)
      : null;
  useEffect(() => {
    if (view === "servers" && selectedServerId && lastChannelId) {
      markNotificationChannelRead(lastChannelId);
    }
  }, [
    view,
    selectedServerId,
    lastChannelId,
    notificationHistory.items,
    markNotificationChannelRead,
  ]);
  useEffect(() => {
    if (openedConversationId) {
      markNotificationConversationRead(openedConversationId);
    }
  }, [
    openedConversationId,
    notificationHistory.items,
    markNotificationConversationRead,
  ]);

  const toggleNotifications = useCallback(() => {
    setIsNotificationsOpen((isOpen) => {
      if (!isOpen) void refreshNotificationsRef.current();
      return !isOpen;
    });
  }, []);
  const notificationsValue = useMemo<NotificationsValue>(
    () => ({
      unreadCount: notificationReads.unreadCount,
      isOpen: isNotificationsOpen,
      anchorRef: notificationsAnchorRef,
      toggle: toggleNotifications,
    }),
    [notificationReads.unreadCount, isNotificationsOpen, toggleNotifications],
  );

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

  const hasOpenedInitialPartner = useRef(false);
  useEffect(() => {
    if (!initialPartnerId || !userId || hasOpenedInitialPartner.current) return;
    hasOpenedInitialPartner.current = true;
    openConversation(initialPartnerId);
  }, [initialPartnerId, userId, openConversation]);

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
    if (initialSelectedServerId !== null || initialPartnerId !== null) {
      router.replace(ROUTES.home);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ownProfileValue = useMemo(
    () => ({ profile: ownProfile, refresh: refreshOwnProfile }),
    [ownProfile, refreshOwnProfile],
  );

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

  function openMention(serverId: string, channelId: string) {
    setView("servers");
    setSelectedServerId(serverId);
    setLastChannelId(channelId);
    setServerViewNonce((nonce) => nonce + 1);
  }

  function openNotificationConversation(partner: MessageAuthor | string) {
    if (typeof partner === "string") {
      directMessages.openConversation(partner);
    } else {
      directMessages.openConversation(partner.id, partner);
    }
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

  function updateServer(server: ServerSummary) {
    setServers((prev) =>
      prev.map((existing) => (existing.id === server.id ? server : existing)),
    );
  }

  return (
    <OwnProfileProvider value={ownProfileValue}>
      <PresenceProvider value={presenceValue}>
        <PrivateCallProvider
          currentUserId={currentAuthor?.id ?? null}
          resolvePartner={resolveCallPartner}
        >
          <NotificationsProvider value={notificationsValue}>
            <MobilePanelsProvider>
              <div className="flex h-dvh w-full flex-col overflow-hidden">
                <PlatformStatusNotice />
                <div
                  className="relative flex min-h-0 w-full flex-1 overflow-hidden"
                  style={{ background: "var(--bg-chat)" }}
                >
                  <ServerRail
                    servers={servers}
                    selectedServerId={selectedServerId}
                    isDirectMessagesActive={view === "direct-messages"}
                    isDockedOnMobile={
                      view === "direct-messages" &&
                      !directMessages.activeSummary
                    }
                    unreadDmCount={unreadDmCount}
                    unreadByServer={unread.byServer}
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
                      onOpenOwnProfile={() => setOwnProfileServerId(null)}
                      servers={servers}
                      directMessages={directMessages}
                    />
                  ) : selectedServer ? (
                    <ServerView
                      key={`${selectedServer.id}:${serverViewNonce}`}
                      server={selectedServer}
                      onLeft={() => removeServer(selectedServer.id)}
                      onServerUpdate={updateServer}
                      ownProfile={ownProfile}
                      onOpenOwnProfile={(serverId) =>
                        setOwnProfileServerId(serverId ?? null)
                      }
                      onMessageUser={messageUser}
                      unreadByChannel={unread.byChannel}
                      initialChannelId={lastChannelId}
                      onChannelChange={setLastChannelId}
                    />
                  ) : (
                    <HomeView
                      hasServers={servers.length > 0}
                      userName={user?.name}
                      ownProfile={ownProfile}
                      onOpenOwnProfile={() => setOwnProfileServerId(null)}
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

                  {isNotificationsOpen ? (
                    <NotificationCenter
                      history={notificationHistory}
                      reads={notificationReads}
                      servers={servers}
                      me={currentAuthor}
                      anchorRef={notificationsAnchorRef}
                      onClose={() => setIsNotificationsOpen(false)}
                      onOpenMention={openMention}
                      onOpenDirectMessage={openNotificationConversation}
                    />
                  ) : null}

                  {ownProfileServerId !== undefined && ownProfile ? (
                    <OwnProfileModal
                      serverId={ownProfileServerId ?? undefined}
                      profile={ownProfile}
                      onClose={() => setOwnProfileServerId(undefined)}
                      onUpdated={setOwnProfile}
                    />
                  ) : null}

                  {currentAuthor ? (
                    <PrivateCallDialog me={currentAuthor} />
                  ) : null}
                  <PrivateCallBanner />
                  <PrivateCallNotice />
                </div>
              </div>
            </MobilePanelsProvider>
          </NotificationsProvider>
        </PrivateCallProvider>
      </PresenceProvider>
    </OwnProfileProvider>
  );
}

export function HomeShell(props: HomeShellProps) {
  return (
    <BlockedUsersProvider>
      <NotificationSettingsProvider>
        <VoiceSessionProvider>
          <HomeShellContent {...props} />
        </VoiceSessionProvider>
      </NotificationSettingsProvider>
    </BlockedUsersProvider>
  );
}
