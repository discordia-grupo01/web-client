"use client";

import {
  type Category,
  type Channel,
  channelsOfCategory,
  hasPermission,
  isUnassignedCategory,
  type Role,
  type ServerSummary,
  sortByPosition,
  topLevelChannels,
  type User,
  visibleCategories,
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
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  BanMemberModal,
  type BanTarget,
} from "@/components/bans/BanMemberModal";
import { avatarSrcOf } from "@/lib/userProfile";
import { PublicProfileModal } from "@/components/profile/PublicProfileModal";
import { UserPanel } from "@/components/profile/UserPanel";
import { CreateCategoryModal } from "@/components/categories/CreateCategoryModal";
import { EditCategoryModal } from "@/components/categories/EditCategoryModal";
import { ChannelHeader } from "@/components/channels/ChannelHeader";
import { CreateChannelModal } from "@/components/channels/CreateChannelModal";
import { DeleteChannelModal } from "@/components/channels/DeleteChannelModal";
import { EditChannelModal } from "@/components/channels/EditChannelModal";
import { VoiceChannelPlaceholder } from "@/components/channels/VoiceChannelPlaceholder";
import { MobileNavButton } from "@/components/layout/MobileNavButton";
import { useMobilePanels } from "@/components/layout/MobilePanelsContext";
import { SidePanel } from "@/components/layout/SidePanel";
import { MembersSidebar } from "@/components/members/MembersSidebar";
import { ChannelChat } from "@/components/messages/ChannelChat";
import { useAuth } from "@/services/auth/auth-context";
import { reorderCategoriesRequest } from "@/services/categories/client";
import {
  moveChannelToCategoryRequest,
  reorderChannelsRequest,
} from "@/services/channels/client";
import { authorFromProfile } from "@/services/messages/author";
import {
  listMemberRolesRequest,
  listRolesRequest,
} from "@/services/roles/client";
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

interface ServerViewProps {
  server: ServerSummary;
  onLeft: () => void;
  onServerUpdate: (server: ServerSummary) => void;
  /** Levantado a `HomeShell`: se comparte con el estado "sin servidor". */
  ownProfile: User | null;
  onOpenOwnProfile: () => void;
}

function ChannelRow({
  channel,
  active,
  canManage,
  onClick,
  onEdit,
  onDelete,
}: {
  channel: Channel;
  active: boolean;
  canManage: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const Icon = channel.kind === "text" ? Hash : Volume2;
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="group relative flex items-center">
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
          active
            ? "text-content bg-accent/20"
            : "text-content-muted hover:bg-surface-hover",
        )}
      >
        <Icon
          size={16}
          className={active ? "text-accent" : "text-content-subtle"}
        />
        <span className="truncate">{channel.name}</span>
      </button>

      {canManage ? (
        <>
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label="Opciones del canal"
            className="text-content-subtle hover:text-content absolute right-1 flex size-6 shrink-0 cursor-pointer items-center justify-center rounded opacity-0 transition-opacity group-hover:opacity-100"
          >
            <MoreVertical size={14} />
          </button>

          {isMenuOpen ? (
            <>
              <button
                type="button"
                aria-label="Cerrar menu"
                onClick={() => setIsMenuOpen(false)}
                className="fixed inset-0 z-40 cursor-default"
              />
              <div className="bg-surface-raised border-line absolute top-full right-0 z-50 mt-1 w-44 overflow-hidden rounded-xl border shadow-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onEdit();
                  }}
                  className="text-content hover:bg-surface-hover flex w-full cursor-pointer items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors"
                >
                  <Pencil size={14} />
                  Editar Canal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onDelete();
                  }}
                  className="text-danger hover:bg-danger/10 flex w-full cursor-pointer items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors"
                >
                  <Trash2 size={14} />
                  Eliminar Canal
                </button>
              </div>
            </>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function SortableChannelRow(props: {
  channel: Channel;
  active: boolean;
  canManage: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { channel, canManage } = props;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: channel.id, disabled: !canManage });

  if (!canManage) return <ChannelRow {...props} />;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.35 : 1,
      }}
      className="touch-none"
    >
      <ChannelRow {...props} />
    </div>
  );
}

function CategoryDropZone({
  bucket,
  items,
  children,
}: {
  bucket: string;
  items: string[];
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

export function ServerView({
  server,
  onLeft,
  onServerUpdate,
  ownProfile,
  onOpenOwnProfile,
}: ServerViewProps) {
  const { user } = useAuth();
  const { openPanel, close: closeMobilePanel } = useMobilePanels();
  const isOwner = user !== null && String(user.id) === server.owner_id;
  const currentAuthor = useMemo(
    () => (ownProfile ? authorFromProfile(ownProfile) : null),
    [ownProfile],
  );
  const [myRoles, setMyRoles] = useState<Role[]>([]);
  const [serverRoles, setServerRoles] = useState<Role[]>([]);

  /**
   * Roles asignados al usuario actual en este servidor
   */
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

  /** Catalogo completo de roles del server, para colorear menciones a `@Rol`. */
  useEffect(() => {
    let cancelled = false;
    listRolesRequest(server.id).then((result) => {
      if (!cancelled && result.ok) setServerRoles(result.roles);
    });
    return () => {
      cancelled = true;
    };
  }, [server.id]);

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
  const canInvite = hasPermission({ isOwner, roles: myRoles }, "CREATE_INVITE");
  const canManageMessages = hasPermission(
    { isOwner, roles: myRoles },
    "MANAGE_MESSAGES",
  );
  const canMentionEveryone = hasPermission(
    { isOwner, roles: myRoles },
    "MENTION_EVERYONE",
  );

  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [banTarget, setBanTarget] = useState<BanTarget | null>(null);
  /** Sube al banear a alguien: remonta la lista de miembros para que ya no aparezca. */
  const [membersVersion, setMembersVersion] = useState(0);
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [createChannelDefaultCategoryId, setCreateChannelDefaultCategoryId] =
    useState<string | null>(null);
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
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
    () => server.channels[0]?.id ?? "",
  );
  const activeChannel = server.channels.find(
    (channel) => channel.id === activeChannelId,
  );

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
    setEditingChannel(null);
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
      const targetCategoryId = resolveBucketCategoryId(overBucket);
      if (targetCategoryId === channel.category_id) return;

      const previousChannels = server.channels;
      onServerUpdate({
        ...server,
        channels: previousChannels.map((existing) =>
          existing.id === channel.id
            ? { ...existing, category_id: targetCategoryId }
            : existing,
        ),
      });

      const result = await moveChannelToCategoryRequest(
        channel.id,
        targetCategoryId,
      );
      if (!result.ok) {
        setDragError(result.message);
        onServerUpdate({ ...server, channels: previousChannels });
        return;
      }

      onServerUpdate({
        ...server,
        channels: previousChannels.map((existing) =>
          existing.id === channel.id ? result.channel : existing,
        ),
      });
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
        onClick={() => {
          setActiveChannelId(channel.id);
          closeMobilePanel();
        }}
        onEdit={() => setEditingChannel(channel)}
        onDelete={() => setDeletingChannel(channel)}
      />
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
            onPermissionsChanged={fetchMyRoles}
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
              {uncategorized.length > 0 ? (
                <CategoryDropZone
                  bucket={UNCATEGORIZED_BUCKET}
                  items={uncategorized.map((channel) => channel.id)}
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
            <UserPanel user={ownProfile} onClick={onOpenOwnProfile} />
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
            />

            {activeChannel.kind === "text" ? (
              <ChannelChat
                key={activeChannel.id}
                channel={activeChannel}
                currentAuthor={currentAuthor}
                serverRoles={serverRoles}
                canManageMessages={canManageMessages}
                canMentionEveryone={canMentionEveryone}
              />
            ) : (
              <VoiceChannelPlaceholder name={activeChannel.name} />
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
          onOpenOwnProfile={onOpenOwnProfile}
          onOpenPublicProfile={setViewingUserId}
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

      {editingChannel ? (
        <EditChannelModal
          channel={editingChannel}
          onClose={() => setEditingChannel(null)}
          onUpdated={handleChannelUpdated}
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
          onBan={(profile) => {
            setViewingUserId(null);
            setBanTarget({
              userId: profile.id,
              name: profile.name,
              avatarSrc: avatarSrcOf(profile.id, profile),
            });
          }}
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
    </div>
  );
}
