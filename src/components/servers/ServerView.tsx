"use client";

import {
  type AccessRevokedReason,
  type Category,
  type Channel,
  type ChannelOverridePermission,
  channelsOfCategory,
  hasPermission,
  isMemberMuted,
  isUnassignedCategory,
  type PublicUser,
  type Role,
  UNMUTE_ACTION_LABEL,
  type ServerSummary,
  sortByPosition,
  topLevelChannels,
  toVoicePresence,
  voiceParticipantsOf,
  type User,
  VOICE_CONNECTING,
  VOICE_RECONNECTING,
  visibleCategories,
  voiceConnectedCount,
  withLivePresence,
} from "@discordia/client-shared";

import {
  closestCenter,
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronDown,
  ChevronRight,
  Hash,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
  Volume2,
  Mic,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  BanMemberModal,
  type BanTarget,
} from "@/components/bans/BanMemberModal";
import { avatarSrcOf } from "@/lib/userProfile";
import { KickMemberModal } from "@/components/moderation/KickMemberModal";
import { MuteMemberModal } from "@/components/moderation/MuteMemberModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { unmuteMemberRequest } from "@/services/moderation/client";
import { PublicProfileModal } from "@/components/profile/PublicProfileModal";
import { UserPanel } from "@/components/profile/UserPanel";
import { CreateCategoryModal } from "@/components/categories/CreateCategoryModal";
import { EditCategoryModal } from "@/components/categories/EditCategoryModal";
import { ChannelHeader } from "@/components/channels/ChannelHeader";
import { CreateChannelModal } from "@/components/channels/CreateChannelModal";
import { DeleteChannelModal } from "@/components/channels/DeleteChannelModal";
import { SortableChannelRow } from "@/components/channels/ChannelRow";
import {
  type ChannelSettingsSection,
  ChannelSettingsModal,
} from "@/components/channels/settings/ChannelSettingsModal";
import { MobileNavButton } from "@/components/layout/MobileNavButton";
import { useMobilePanels } from "@/components/layout/MobilePanelsContext";
import { SidePanel } from "@/components/layout/SidePanel";
import { MembersSidebar } from "@/components/members/MembersSidebar";
import { ChannelChat } from "@/components/messages/ChannelChat";
import { ownAvatarSrc } from "@/components/voice/ownAvatar";
import {
  VoiceChannelParticipants,
  type SidebarVoiceParticipant,
} from "@/components/voice/VoiceChannelParticipants";
import { VoiceChannelView } from "@/components/voice/VoiceChannelView";
import { useAuth } from "@/services/auth/AuthContext";
import { reorderCategoriesRequest } from "@/services/categories/client";
import {
  moveChannelToCategoryRequest,
  reorderChannelsRequest,
} from "@/services/channels/client";
import { useMyChannelPermissions } from "@/services/channel-permissions/useChannelOverrides";
import { authorFromProfile } from "@/services/messages/author";
import {
  listMemberRolesRequest,
  listRolesRequest,
} from "@/services/roles/client";
import { listServersRequest } from "@/services/servers/client";
import { useVoicePresence } from "@/services/voice/useVoicePresence";
import { useVoiceSession } from "@/services/voice/VoiceSessionContext";
import { cn } from "@/lib/cn";

import { ServerSidebarHeader } from "./sidebar/ServerSidebarHeader";

/** Id del "bucket" de canales sin categoria (`category_id: null`). */
const UNCATEGORIZED_BUCKET = "none";

function categoryBucket(categoryId: string): string {
  return `cat:${categoryId}`;
}

function bucketCategoryId(bucket: string): string | null {
  return bucket.startsWith("cat:") ? bucket.slice(4) : null;
}

function placeChannelInBucket(
  channels: Channel[],
  moved: Channel,
  orderedIds: string[],
): Channel[] {
  return channels.map((existing) => {
    const current = existing.id === moved.id ? moved : existing;
    const position = orderedIds.indexOf(current.id);
    return position === -1 ? current : { ...current, position };
  });
}

interface ServerViewProps {
  server: ServerSummary;
  onLeft: () => void;
  onServerUpdate: (server: ServerSummary) => void;
  /** Levantado a `HomeShell`: se comparte con el estado "sin servidor". */
  ownProfile: User | null;
  /** Con `serverId` el perfil muestra los roles de ese servidor. */
  onOpenOwnProfile: (serverId?: string) => void;
  /** Abre un mensaje directo con alguien (desde su perfil). */
  onMessageUser: (profile: PublicUser) => void;
  /** Menciones sin leer por canal (levantado a `HomeShell`, que tiene la sala personal). */
  unreadMentionsByChannel: Record<string, number>;
  /** Se abrio un canal con menciones sin leer: hay que marcarlas como leidas. */
  onChannelRead: (channelId: string) => void;
  /** Canal a abrir al montar (el ultimo visitado); si ya no existe, el primero. */
  initialChannelId?: string | null;
  /** Avisa el canal abierto, para recordarlo entre recargas. */
  onChannelChange?: (channelId: string) => void;
}

function CategoryDropZone({
  bucket,
  items,
  showEmptyTarget = false,
  children,
}: {
  bucket: string;
  items: string[];
  showEmptyTarget?: boolean;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: bucket });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "space-y-0.5 rounded-md px-0.5 py-0.5 transition-colors",
        isOver ? "bg-accent/10 ring-accent-strong/40 ring-1" : "",
      )}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
      {showEmptyTarget && items.length === 0 ? (
        <div
          className={cn(
            "h-8 rounded-md border border-dashed transition-colors",
            isOver ? "border-accent-strong/60" : "border-line",
          )}
        />
      ) : null}
    </div>
  );
}

function CategorySectionHeader({
  label,
  isCollapsed,
  onToggle,
  canManage,
  onAddChannel,
  onEdit,
  onDelete,
}: {
  label: string;
  isCollapsed: boolean;
  onToggle: () => void;
  canManage: boolean;
  onAddChannel?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const Chevron = isCollapsed ? ChevronRight : ChevronDown;
  const hasMenu = canManage && (onAddChannel || onEdit || onDelete);

  return (
    <div className="group relative flex items-center gap-0.5 px-1">
      <button
        type="button"
        onClick={onToggle}
        className="text-content-subtle hover:text-content flex flex-1 cursor-pointer items-center gap-1 py-1 text-[11px] font-semibold tracking-wider uppercase transition-colors"
      >
        <Chevron size={12} />
        <span className="truncate">{label}</span>
      </button>

      {hasMenu ? (
        <button
          type="button"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-label="Opciones de la categoría"
          className="text-content-subtle hover:text-content flex size-5 shrink-0 cursor-pointer items-center justify-center rounded opacity-0 transition-opacity group-hover:opacity-100"
        >
          <MoreVertical size={13} />
        </button>
      ) : null}

      {isMenuOpen ? (
        <>
          <button
            type="button"
            aria-label="Cerrar menu"
            onClick={() => setIsMenuOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div className="bg-surface-raised border-line absolute top-full right-0 z-50 mt-1 w-48 overflow-hidden rounded-xl border shadow-2xl">
            {onAddChannel ? (
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onAddChannel();
                }}
                className="text-content hover:bg-surface-hover flex w-full cursor-pointer items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors"
              >
                <Plus size={14} />
                Añadir Canal
              </button>
            ) : null}
            {onEdit ? (
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onEdit();
                }}
                className="text-content hover:bg-surface-hover flex w-full cursor-pointer items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors"
              >
                <Pencil size={14} />
                Editar Categoría
              </button>
            ) : null}
            {onDelete ? (
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onDelete();
                }}
                className="text-danger hover:bg-danger/10 flex w-full cursor-pointer items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors"
              >
                <Trash2 size={14} />
                Eliminar Categoría
              </button>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}

function SortableCategorySection({
  category,
  canManage,
  isCollapsed,
  onToggle,
  onAddChannel,
  onEdit,
  children,
}: {
  category: Category;
  canManage: boolean;
  isCollapsed: boolean;
  onToggle: () => void;
  onAddChannel: () => void;
  onEdit: () => void;
  children: ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id, disabled: !canManage });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <div
        {...(canManage ? { ...listeners, ...attributes } : {})}
        className={canManage ? "touch-none" : undefined}
      >
        <CategorySectionHeader
          label={category.name}
          isCollapsed={isCollapsed}
          onToggle={onToggle}
          canManage={canManage}
          onAddChannel={onAddChannel}
          onEdit={onEdit}
        />
      </div>
      {children}
    </div>
  );
}

// TODO: pasar a client-shared junto con la proxima version (lo va a usar mobile).
function unmuteConfirmBody(name: string): string {
  return `${name} va a poder volver a escribir y hablar en el servidor desde ahora.`;
}

export function ServerView({
  server,
  onLeft,
  onServerUpdate,
  ownProfile,
  onOpenOwnProfile,
  onMessageUser,
  unreadMentionsByChannel,
  onChannelRead,
  initialChannelId = null,
  onChannelChange,
}: ServerViewProps) {
  const { user } = useAuth();
  const { openPanel, close: closeMobilePanel } = useMobilePanels();
  const isOwner = user !== null && String(user.id) === server.owner_id;
  const currentAuthor = useMemo(
    () => (ownProfile ? authorFromProfile(ownProfile) : null),
    [ownProfile],
  );
  const [myRoles, setMyRoles] = useState<Role[]>([]);
  const myRoleIds = useMemo(() => myRoles.map((role) => role.id), [myRoles]);
  const [serverRoles, setServerRoles] = useState<Role[]>([]);

  const fetchMyRoles = useCallback(() => {
    if (!user) {
      setMyRoles([]);
      return;
    }
    let cancelled = false;
    listMemberRolesRequest(server.id, String(user.id)).then((result) => {
      if (cancelled) return;
      setMyRoles(result.ok ? result.roles : []);
    });
    return () => {
      cancelled = true;
    };
  }, [server.id, user]);

  useEffect(() => fetchMyRoles(), [fetchMyRoles]);

  const fetchServerRoles = useCallback(() => {
    let cancelled = false;
    listRolesRequest(server.id).then((result) => {
      if (!cancelled && result.ok) setServerRoles(result.roles);
    });
    return () => {
      cancelled = true;
    };
  }, [server.id]);

  useEffect(() => fetchServerRoles(), [fetchServerRoles]);

  const reloadServer = useCallback(async () => {
    const result = await listServersRequest();
    if (!result.ok) return null;
    const fresh = result.servers.find((item) => item.id === server.id);
    if (fresh) onServerUpdate(fresh);
    return fresh ?? null;
  }, [server.id, onServerUpdate]);

  const canManageChannels = hasPermission(
    { isOwner, roles: myRoles },
    "MANAGE_CHANNELS",
  );
  const canManageRoles = hasPermission(
    { isOwner, roles: myRoles },
    "MANAGE_ROLES",
  );
  const canManageServer = hasPermission(
    { isOwner, roles: myRoles },
    "MANAGE_SERVER",
  );
  const canBanMembers = hasPermission(
    { isOwner, roles: myRoles },
    "BAN_MEMBERS",
  );
  const canKickMembers = hasPermission(
    { isOwner, roles: myRoles },
    "KICK_MEMBERS",
  );
  const canInvite = hasPermission({ isOwner, roles: myRoles }, "CREATE_INVITE");
  const canManageMessages = hasPermission(
    { isOwner, roles: myRoles },
    "MANAGE_MESSAGES",
  );
  const canSendMessages = hasPermission(
    { isOwner, roles: myRoles },
    "SEND_MESSAGES",
  );
  const canMentionEveryone = hasPermission(
    { isOwner, roles: myRoles },
    "MENTION_EVERYONE",
  );
  const canAddReactions = hasPermission(
    { isOwner, roles: myRoles },
    "ADD_REACTIONS",
  );
  const canConnect = hasPermission({ isOwner, roles: myRoles }, "CONNECT");

  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [banTarget, setBanTarget] = useState<BanTarget | null>(null);
  const [kickTarget, setKickTarget] = useState<BanTarget | null>(null);
  const [muteTarget, setMuteTarget] = useState<BanTarget | null>(null);
  const [unmuteTarget, setUnmuteTarget] = useState<BanTarget | null>(null);
  const [unmuteError, setUnmuteError] = useState("");
  /** `muted_until` del miembro cuyo perfil esta abierto (viene de la lista de miembros). */
  const [viewingMutedUntil, setViewingMutedUntil] = useState<string | null>(
    null,
  );
  /** Sube al banear a alguien: remonta la lista de miembros para que ya no aparezca. */
  const [membersVersion, setMembersVersion] = useState(0);
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [createChannelDefaultCategoryId, setCreateChannelDefaultCategoryId] =
    useState<string | null>(null);
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);
  const [settingsTarget, setSettingsTarget] = useState<{
    channelId: string;
    section: ChannelSettingsSection;
  } | null>(null);
  const [permissionsVersion, setPermissionsVersion] = useState(0);
  const [lostChannel, setLostChannel] = useState<Channel | null>(null);
  const [deletingChannel, setDeletingChannel] = useState<Channel | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [draggingChannel, setDraggingChannel] = useState<Channel | null>(null);
  const [draggingCategory, setDraggingCategory] = useState<Category | null>(
    null,
  );
  const [dragError, setDragError] = useState("");
  // Preferencias de la vista, desde la barra del canal.
  const [isBannerVisible, setIsBannerVisible] = useState(true);
  const [isMembersVisible, setIsMembersVisible] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const [activeChannelId, setActiveChannelId] = useState(
    () =>
      server.channels.find((channel) => channel.id === initialChannelId)?.id ??
      server.channels[0]?.id ??
      "",
  );
  useEffect(() => {
    if (activeChannelId) onChannelChange?.(activeChannelId);
  }, [activeChannelId, onChannelChange]);
  const activeChannel =
    server.channels.find((channel) => channel.id === activeChannelId) ??
    (lostChannel?.id === activeChannelId ? lostChannel : undefined);
  const settingsChannel = settingsTarget
    ? server.channels.find((channel) => channel.id === settingsTarget.channelId)
    : undefined;

  const activeChannelPermissions = useMyChannelPermissions(
    activeChannel && activeChannel !== lostChannel ? activeChannel.id : null,
    permissionsVersion,
  );

  const isCheckingChannelPermissions =
    !isOwner && activeChannelPermissions.status === "loading";

  function canInActiveChannel(
    permission: ChannelOverridePermission,
    serverLevel: boolean,
  ): boolean {
    if (isOwner || activeChannelPermissions.status === "unknown") {
      return serverLevel;
    }
    if (activeChannelPermissions.status === "loading") return false;
    return activeChannelPermissions.permissions.includes(permission);
  }

  function handleAccessRevoked(reason: AccessRevokedReason) {
    if (reason !== "permissions_changed" || !activeChannel) return;
    setLostChannel(activeChannel);
    void reloadServer();
  }

  function handleRolesChanged() {
    fetchMyRoles();
    fetchServerRoles();
    setPermissionsVersion((version) => version + 1);
    void reloadServer();
  }

  function openChannelSettings(
    channel: Channel,
    section: ChannelSettingsSection,
  ) {
    fetchServerRoles();
    setSettingsTarget({ channelId: channel.id, section });
  }

  async function handleChannelPermissionsSaved() {
    const channelId = settingsTarget?.channelId;
    setPermissionsVersion((version) => version + 1);
    const fresh = await reloadServer();
    if (!channelId) return;
    if (!fresh || fresh.channels.some((channel) => channel.id === channelId)) {
      setActiveChannelId(channelId);
      return;
    }
    setSettingsTarget(null);
    if (activeChannelId === channelId) {
      setActiveChannelId(fresh.channels[0]?.id ?? "");
    }
  }

  const voice = useVoiceSession();
  const voiceState = voice.state;
  const voiceChannelId =
    voiceState.target?.serverId === server.id
      ? voiceState.target.channelId
      : null;
  const liveVoiceParticipants = useMemo(
    () => (voiceChannelId ? voiceParticipantsOf(voiceState) : []),
    [voiceChannelId, voiceState],
  );
  const { byChannel: socketVoicePresence } = useVoicePresence(server.id);
  const voicePresence = useMemo(
    () =>
      voiceChannelId
        ? withLivePresence(
            socketVoicePresence,
            voiceChannelId,
            toVoicePresence(liveVoiceParticipants),
          )
        : socketVoicePresence,
    [socketVoicePresence, voiceChannelId, liveVoiceParticipants],
  );

  function sidebarVoiceParticipants(
    channelId: string,
  ): SidebarVoiceParticipant[] {
    if (channelId === voiceChannelId) {
      return liveVoiceParticipants.map((participant) => ({
        identity: participant.identity,
        name: participant.name,
        avatarSrc:
          participant.isLocal && ownProfile ? ownAvatarSrc(ownProfile) : null,
        muted: participant.muted,
        speaking: participant.speaking && !participant.mutedForMe,
        cameraOn: participant.cameraOn,
        screenSharing: participant.screenSharing,
      }));
    }
    return (voicePresence[channelId] ?? []).map((participant) => ({
      identity: participant.participant_id,
      name: participant.name,
    }));
  }

  // Tocar "Voz conectada" trae la vista al canal de la llamada. Si el pedido
  // ya estaba antes de montar, lo resolvio `HomeShell` con `initialChannelId`.
  const voiceFocus = voiceState.focus;
  const seenFocusNonce = useRef(voiceFocus?.nonce);
  useEffect(() => {
    if (!voiceFocus || voiceFocus.nonce === seenFocusNonce.current) return;
    seenFocusNonce.current = voiceFocus.nonce;
    if (voiceFocus.serverId !== server.id) return;
    setActiveChannelId(voiceFocus.channelId);
    closeMobilePanel();
  }, [voiceFocus, server.id, closeMobilePanel]);

  // Se borro el canal de la llamada (o ya no lo ves): se corta.
  const leaveVoice = voice.leave;
  const isVoiceChannelGone =
    voiceChannelId !== null &&
    !server.channels.some((channel) => channel.id === voiceChannelId);
  useEffect(() => {
    if (isVoiceChannelGone) leaveVoice();
  }, [isVoiceChannelGone, leaveVoice]);

  // Abrir un canal (o recibir una mencion con el abierto) las marca como leidas.
  const activeUnreadMentions = unreadMentionsByChannel[activeChannelId] ?? 0;
  useEffect(() => {
    if (activeUnreadMentions > 0) onChannelRead(activeChannelId);
  }, [activeChannelId, activeUnreadMentions, onChannelRead]);

  const sortedCategories = sortByPosition(visibleCategories(server.categories));
  const uncategorized = topLevelChannels(server.channels, server.categories);
  const unassignedCategory =
    server.categories.find(isUnassignedCategory) ?? null;

  function toggleCollapsed(id: string) {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleChannelCreated(channel: Channel) {
    setIsCreateChannelOpen(false);
    setCreateChannelDefaultCategoryId(null);
    setActiveChannelId(channel.id);
    onServerUpdate({ ...server, channels: [...server.channels, channel] });
  }

  function handleChannelUpdated(channel: Channel) {
    setActiveChannelId(channel.id);
    onServerUpdate({
      ...server,
      channels: server.channels.map((existing) =>
        existing.id === channel.id ? channel : existing,
      ),
    });
  }

  function handleChannelDeleted() {
    if (!deletingChannel) return;
    const remaining = server.channels.filter(
      (existing) => existing.id !== deletingChannel.id,
    );
    setDeletingChannel(null);
    if (settingsTarget?.channelId === deletingChannel.id) {
      setSettingsTarget(null);
    }
    if (activeChannelId === deletingChannel.id) {
      setActiveChannelId(remaining[0]?.id ?? "");
    }
    onServerUpdate({ ...server, channels: remaining });
  }

  function handleCategoryCreated(category: Category) {
    setIsCreateCategoryOpen(false);
    onServerUpdate({ ...server, categories: [...server.categories, category] });
  }

  function handleCategoryUpdated(category: Category) {
    setEditingCategory(null);
    onServerUpdate({
      ...server,
      categories: server.categories.map((existing) =>
        existing.id === category.id ? category : existing,
      ),
    });
  }

  function bucketOfChannel(channel: Channel): string {
    if (
      channel.category_id === null ||
      channel.category_id === unassignedCategory?.id
    ) {
      return UNCATEGORIZED_BUCKET;
    }
    return categoryBucket(channel.category_id);
  }

  function resolveBucketCategoryId(bucket: string): string | null {
    if (bucket === UNCATEGORIZED_BUCKET) return unassignedCategory?.id ?? null;
    return bucketCategoryId(bucket);
  }

  /** Todos los canales que hoy estan en ese bucket, ordenados por posicion. */
  function channelsInBucket(bucket: string): Channel[] {
    if (bucket === UNCATEGORIZED_BUCKET) return uncategorized;
    const categoryId = bucketCategoryId(bucket);
    return channelsOfCategory(server.channels, categoryId);
  }

  /** Resuelve a que bucket corresponde un id de `over` (un canal o un contenedor vacio). */
  function resolveOverBucket(overId: string): string | undefined {
    if (overId === UNCATEGORIZED_BUCKET || overId.startsWith("cat:")) {
      return overId;
    }
    const overChannel = server.channels.find((c) => c.id === overId);
    return overChannel ? bucketOfChannel(overChannel) : undefined;
  }

  function handleDragStart(event: DragStartEvent) {
    setDragError("");
    const id = String(event.active.id);

    const category = server.categories.find((c) => c.id === id);
    if (category) {
      setDraggingCategory(category);
      setDraggingChannel(null);
      return;
    }

    const channel = server.channels.find((c) => c.id === id);
    setDraggingChannel(channel ?? null);
    setDraggingCategory(null);
  }

  /** Reordena las categorias del server en si (no los canales de adentro). */
  async function handleCategoryReordered(activeId: string, overId: string) {
    if (activeId === overId) return;

    const oldIndex = sortedCategories.findIndex((c) => c.id === activeId);
    const overIndex = sortedCategories.findIndex((c) => c.id === overId);
    if (oldIndex === -1 || overIndex === -1 || oldIndex === overIndex) return;

    const reordered = arrayMove(sortedCategories, oldIndex, overIndex);
    const previousCategories = server.categories;
    const unassigned = previousCategories.find(
      (category) =>
        !sortedCategories.some((visible) => visible.id === category.id),
    );
    const categoryIds = unassigned
      ? [...reordered.map((c) => c.id), unassigned.id]
      : reordered.map((c) => c.id);

    onServerUpdate({
      ...server,
      categories: previousCategories.map((existing) => {
        const position = categoryIds.indexOf(existing.id);
        return position === -1 ? existing : { ...existing, position };
      }),
    });

    const result = await reorderCategoriesRequest(server.id, categoryIds);
    if (!result.ok) {
      setDragError(result.message);
      onServerUpdate({ ...server, categories: previousCategories });
    }
  }

  async function moveChannelToBucket(
    channel: Channel,
    targetBucket: string,
    overId: string,
  ) {
    const targetCategoryId = resolveBucketCategoryId(targetBucket);
    if (targetCategoryId === channel.category_id) return;

    const targetIds = channelsInBucket(targetBucket).map((c) => c.id);
    const overIndex = targetIds.indexOf(overId);
    const insertAt = overIndex === -1 ? targetIds.length : overIndex;
    const orderedIds = [
      ...targetIds.slice(0, insertAt),
      channel.id,
      ...targetIds.slice(insertAt),
    ];

    const previousChannels = server.channels;
    onServerUpdate({
      ...server,
      channels: placeChannelInBucket(
        previousChannels,
        { ...channel, category_id: targetCategoryId },
        orderedIds,
      ),
    });

    const moved = await moveChannelToCategoryRequest(
      channel.id,
      targetCategoryId,
    );
    if (!moved.ok) {
      setDragError(moved.message);
      onServerUpdate({ ...server, channels: previousChannels });
      return;
    }

    const reordered = await reorderChannelsRequest(
      server.id,
      moved.channel.category_id,
      orderedIds,
    );
    if (!reordered.ok) {
      setDragError(reordered.message);
      onServerUpdate({
        ...server,
        channels: previousChannels.map((existing) =>
          existing.id === channel.id ? moved.channel : existing,
        ),
      });
      return;
    }

    onServerUpdate({
      ...server,
      channels: placeChannelInBucket(
        previousChannels,
        moved.channel,
        orderedIds,
      ),
    });
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setDraggingChannel(null);
    setDraggingCategory(null);
    if (!over) return;

    const activeId = String(active.id);
    const activeCategory = server.categories.find((c) => c.id === activeId);
    if (activeCategory) {
      await handleCategoryReordered(activeId, String(over.id));
      return;
    }

    const channel = server.channels.find((c) => c.id === active.id);
    if (!channel) return;

    const activeBucket = bucketOfChannel(channel);
    const overBucket = resolveOverBucket(String(over.id));
    if (!overBucket) return;

    if (overBucket !== activeBucket) {
      await moveChannelToBucket(channel, overBucket, String(over.id));
      return;
    }

    // Mismo bucket: reordenar.
    const overId = String(over.id);
    if (overId === channel.id) return;

    const bucketChannels = channelsInBucket(activeBucket);
    const oldIndex = bucketChannels.findIndex((c) => c.id === channel.id);
    const overIndex = bucketChannels.findIndex((c) => c.id === overId);
    const newIndex = overIndex === -1 ? bucketChannels.length - 1 : overIndex;
    if (oldIndex === -1 || oldIndex === newIndex) return;

    const reordered = arrayMove(bucketChannels, oldIndex, newIndex);
    const categoryId = resolveBucketCategoryId(activeBucket);
    const channelIds = reordered.map((c) => c.id);

    const result = await reorderChannelsRequest(
      server.id,
      categoryId,
      channelIds,
    );
    if (!result.ok) {
      setDragError(result.message);
      return;
    }

    onServerUpdate({
      ...server,
      channels: server.channels.map((existing) => {
        const position = channelIds.indexOf(existing.id);
        return position === -1 ? existing : { ...existing, position };
      }),
    });
  }

  function renderChannelList(channels: Channel[]) {
    return channels.map((channel) => (
      <SortableChannelRow
        key={channel.id}
        channel={channel}
        active={channel.id === activeChannelId}
        canManage={canManageChannels}
        canManagePermissions={canManageRoles}
        unreadMentions={unreadMentionsByChannel[channel.id]}
        onClick={() => {
          setActiveChannelId(channel.id);
          closeMobilePanel();
        }}
        onEdit={() => openChannelSettings(channel, "overview")}
        onEditPermissions={() => openChannelSettings(channel, "permissions")}
        onDelete={() => setDeletingChannel(channel)}
        isVoiceConnected={channel.id === voiceChannelId}
      >
        {channel.kind === "voice" ? (
          <VoiceChannelParticipants
            participants={sidebarVoiceParticipants(channel.id)}
          />
        ) : null}
      </SortableChannelRow>
    ));
  }

  return (
    <div className="flex min-w-0 flex-1 overflow-hidden">
      {/* Channel sidebar */}
      <SidePanel position="afterRail" isOpen={openPanel === "nav"}>
        <div
          className="flex w-60 shrink-0 flex-col overflow-hidden"
          style={{ background: "var(--bg-channels)" }}
        >
          <ServerSidebarHeader
            server={server}
            isBannerVisible={isBannerVisible}
            canManageServer={canManageServer}
            canManageMessages={canManageMessages}
            canManageChannels={canManageChannels}
            canManageRoles={canManageRoles}
            canBanMembers={canBanMembers}
            canInvite={canInvite}
            myRoles={myRoles}
            onLeft={onLeft}
            onCreateChannel={() => {
              setCreateChannelDefaultCategoryId(null);
              setIsCreateChannelOpen(true);
            }}
            onCreateCategory={() => setIsCreateCategoryOpen(true)}
            onServerUpdated={onServerUpdate}
            onOpenMemberProfile={setViewingUserId}
            onBanMember={setBanTarget}
            bansVersion={membersVersion}
            onOwnershipAccepted={() => {
              if (!user) return;
              onServerUpdate({ ...server, owner_id: String(user.id) });
            }}
            onPermissionsChanged={handleRolesChanged}
          />

          {dragError ? (
            <div className="text-danger mx-2 mb-1 rounded-md bg-black/20 px-2 py-1.5 text-xs">
              {dragError}
            </div>
          ) : null}

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex-1 space-y-3 overflow-y-auto px-2 py-1">
              {uncategorized.length > 0 || canManageChannels ? (
                <CategoryDropZone
                  bucket={UNCATEGORIZED_BUCKET}
                  items={uncategorized.map((channel) => channel.id)}
                  showEmptyTarget={draggingChannel !== null}
                >
                  {renderChannelList(uncategorized)}
                </CategoryDropZone>
              ) : null}

              <SortableContext
                items={sortedCategories.map((category) => category.id)}
                strategy={verticalListSortingStrategy}
              >
                {sortedCategories.map((category) => {
                  const channels = channelsOfCategory(
                    server.channels,
                    category.id,
                  );
                  const collapsed = collapsedIds.has(category.id);

                  return (
                    <SortableCategorySection
                      key={category.id}
                      category={category}
                      canManage={canManageChannels}
                      isCollapsed={collapsed}
                      onToggle={() => toggleCollapsed(category.id)}
                      onAddChannel={() => {
                        setCreateChannelDefaultCategoryId(category.id);
                        setIsCreateChannelOpen(true);
                      }}
                      onEdit={() => setEditingCategory(category)}
                    >
                      {!collapsed ? (
                        <CategoryDropZone
                          bucket={categoryBucket(category.id)}
                          items={channels.map((channel) => channel.id)}
                        >
                          {renderChannelList(channels)}
                        </CategoryDropZone>
                      ) : null}
                    </SortableCategorySection>
                  );
                })}
              </SortableContext>
            </div>

            <DragOverlay>
              {draggingChannel ? (
                <div className="bg-surface-raised border-line-strong text-content flex items-center gap-2 rounded-md border px-2 py-1.5 text-sm shadow-2xl">
                  {draggingChannel.kind === "text" ? (
                    <Hash size={16} className="text-content-subtle" />
                  ) : (
                    <Volume2 size={16} className="text-content-subtle" />
                  )}
                  <span className="truncate">{draggingChannel.name}</span>
                </div>
              ) : null}
              {draggingCategory ? (
                <div className="bg-surface-raised border-line-strong text-content flex items-center rounded-md border px-2 py-1.5 text-[11px] font-semibold tracking-wider uppercase shadow-2xl">
                  <span className="truncate">{draggingCategory.name}</span>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>

          {ownProfile ? (
            <UserPanel user={ownProfile} onClick={() => onOpenOwnProfile()} />
          ) : null}
        </div>
      </SidePanel>

      {/* Content area */}
      <div
        className="flex min-w-0 flex-1 flex-col overflow-hidden"
        style={{ background: "var(--bg-chat)" }}
      >
        {activeChannel ? (
          <>
            <ChannelHeader
              channel={activeChannel}
              hasBanner={server.banner_url !== null}
              isBannerVisible={isBannerVisible}
              onToggleBanner={() => setIsBannerVisible((prev) => !prev)}
              isMembersVisible={isMembersVisible}
              onToggleMembers={() => setIsMembersVisible((prev) => !prev)}
              voicePill={
                activeChannel.id === voiceChannelId
                  ? {
                      label:
                        voiceState.status === "connected"
                          ? voiceConnectedCount(liveVoiceParticipants.length)
                          : voiceState.status === "reconnecting"
                            ? VOICE_RECONNECTING
                            : VOICE_CONNECTING,
                      isLive: voiceState.status === "connected",
                    }
                  : null
              }
            />

            {activeChannel.kind === "text" ? (
              <ChannelChat
                key={activeChannel.id}
                serverId={server.id}
                channel={activeChannel}
                currentAuthor={currentAuthor}
                serverRoles={serverRoles}
                myRoleIds={myRoleIds}
                canManageMessages={canInActiveChannel(
                  "MANAGE_MESSAGES",
                  canManageMessages,
                )}
                canSendMessages={canInActiveChannel(
                  "SEND_MESSAGES",
                  canSendMessages,
                )}
                canMentionEveryone={canMentionEveryone}
                canAddReactions={canInActiveChannel(
                  "ADD_REACTIONS",
                  canAddReactions,
                )}
                isCheckingPermissions={isCheckingChannelPermissions}
                onAccessRevoked={handleAccessRevoked}
              />
            ) : (
              <VoiceChannelView
                channel={activeChannel}
                serverId={server.id}
                serverName={server.name}
                canConnect={canInActiveChannel("CONNECT", canConnect)}
                isCheckingAccess={isCheckingChannelPermissions}
                ownProfile={ownProfile}
                presence={voicePresence[activeChannel.id] ?? []}
              />
            )}
          </>
        ) : (
          <div className="p-2 md:hidden">
            <MobileNavButton />
          </div>
        )}
      </div>

      {/* En mobile es un drawer (siempre montado); en desktop se oculta con
          el boton de miembros del header. */}
      <SidePanel
        position="right"
        isOpen={openPanel === "members"}
        className={isMembersVisible ? undefined : "md:hidden"}
      >
        <MembersSidebar
          key={`${server.id}:${server.owner_id}:${membersVersion}`}
          serverId={server.id}
          currentUserId={ownProfile?.id ?? user?.id ?? null}
          ownProfile={ownProfile}
          onOpenOwnProfile={() => onOpenOwnProfile(server.id)}
          onOpenPublicProfile={(userId, member) => {
            setViewingMutedUntil(
              member && isMemberMuted(member)
                ? (member.muted_until ?? null)
                : null,
            );
            setViewingUserId(userId);
          }}
        />
      </SidePanel>

      {isCreateChannelOpen ? (
        <CreateChannelModal
          serverId={server.id}
          categories={server.categories}
          defaultCategoryId={createChannelDefaultCategoryId}
          onClose={() => {
            setIsCreateChannelOpen(false);
            setCreateChannelDefaultCategoryId(null);
          }}
          onCreated={handleChannelCreated}
        />
      ) : null}

      {settingsTarget && settingsChannel ? (
        <ChannelSettingsModal
          key={settingsChannel.id}
          channel={settingsChannel}
          categoryName={
            server.categories.find(
              (category) =>
                category.id === settingsChannel.category_id &&
                !isUnassignedCategory(category),
            )?.name ?? null
          }
          initialSection={settingsTarget.section}
          canManageChannel={canManageChannels}
          canManagePermissions={canManageRoles}
          isOwner={isOwner}
          myRoles={myRoles}
          serverRoles={serverRoles}
          onClose={() => setSettingsTarget(null)}
          onChannelUpdated={handleChannelUpdated}
          onPermissionsSaved={() => void handleChannelPermissionsSaved()}
          onDelete={() => setDeletingChannel(settingsChannel)}
        />
      ) : null}

      {deletingChannel ? (
        <DeleteChannelModal
          channel={deletingChannel}
          onClose={() => setDeletingChannel(null)}
          onDeleted={handleChannelDeleted}
        />
      ) : null}

      {isCreateCategoryOpen ? (
        <CreateCategoryModal
          serverId={server.id}
          onClose={() => setIsCreateCategoryOpen(false)}
          onCreated={handleCategoryCreated}
        />
      ) : null}

      {editingCategory ? (
        <EditCategoryModal
          category={editingCategory}
          onClose={() => setEditingCategory(null)}
          onUpdated={handleCategoryUpdated}
        />
      ) : null}

      {viewingUserId ? (
        <PublicProfileModal
          serverId={server.id}
          userId={viewingUserId}
          canManageRoles={canManageRoles}
          canBan={
            canBanMembers &&
            viewingUserId !== String(user?.id) &&
            viewingUserId !== server.owner_id
          }
          canKick={
            canKickMembers &&
            viewingUserId !== String(user?.id) &&
            viewingUserId !== server.owner_id
          }
          onKick={(profile) => {
            setViewingUserId(null);
            setKickTarget({
              userId: profile.id,
              name: profile.name,
              avatarSrc: avatarSrcOf(profile.id, profile),
            });
          }}
          mutedUntil={viewingMutedUntil}
          canMute={
            canManageMessages &&
            viewingUserId !== String(user?.id) &&
            viewingUserId !== server.owner_id
          }
          onMute={(profile) => {
            setViewingUserId(null);
            setMuteTarget({
              userId: profile.id,
              name: profile.name,
              avatarSrc: avatarSrcOf(profile.id, profile),
            });
          }}
          onUnmute={(profile) => {
            setViewingUserId(null);
            setUnmuteError("");
            setUnmuteTarget({
              userId: profile.id,
              name: profile.name,
              avatarSrc: avatarSrcOf(profile.id, profile),
            });
          }}
          canBlock={viewingUserId !== String(user?.id)}
          onBan={(profile) => {
            setViewingUserId(null);
            setBanTarget({
              userId: profile.id,
              name: profile.name,
              avatarSrc: avatarSrcOf(profile.id, profile),
            });
          }}
          onSendMessage={
            viewingUserId !== String(user?.id)
              ? (profile) => {
                  setViewingUserId(null);
                  onMessageUser(profile);
                }
              : undefined
          }
          onClose={() => setViewingUserId(null)}
        />
      ) : null}

      {banTarget ? (
        <BanMemberModal
          serverId={server.id}
          userId={banTarget.userId}
          name={banTarget.name}
          avatarSrc={banTarget.avatarSrc}
          onClose={() => setBanTarget(null)}
          onBanned={() => setMembersVersion((version) => version + 1)}
        />
      ) : null}

      {muteTarget ? (
        <MuteMemberModal
          serverId={server.id}
          target={muteTarget}
          onClose={() => setMuteTarget(null)}
          onMuted={() => setMembersVersion((version) => version + 1)}
        />
      ) : null}

      {unmuteTarget ? (
        <ConfirmDialog
          icon={Mic}
          title={UNMUTE_ACTION_LABEL}
          body={unmuteError || unmuteConfirmBody(unmuteTarget.name)}
          confirmLabel={UNMUTE_ACTION_LABEL}
          onCancel={() => setUnmuteTarget(null)}
          onConfirm={async () => {
            const result = await unmuteMemberRequest(
              server.id,
              unmuteTarget.userId,
            );
            if (!result.ok) {
              setUnmuteError(result.message);
              return;
            }
            setUnmuteTarget(null);
            setMembersVersion((version) => version + 1);
          }}
        />
      ) : null}

      {kickTarget ? (
        <KickMemberModal
          serverId={server.id}
          target={kickTarget}
          onClose={() => setKickTarget(null)}
          onKicked={() => setMembersVersion((version) => version + 1)}
        />
      ) : null}
    </div>
  );
}
