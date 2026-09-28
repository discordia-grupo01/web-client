"use client";

import {
  type Category,
  type Channel,
  CHANNEL_START_NOTICE,
  channelsOfCategory,
  hasPermission,
  type Role,
  type ServerSummary,
  sortByPosition,
  type User,
  VOICE_NOT_IMPLEMENTED,
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
import { useCallback, useEffect, useState, type ReactNode } from "react";

import { PublicProfileModal } from "@/components/profile/public-profile-modal";
import { UserPanel } from "@/components/profile/user-panel";
import { CreateCategoryModal } from "@/components/categories/create-category-modal";
import { EditCategoryModal } from "@/components/categories/edit-category-modal";
import { ChannelHeader } from "@/components/channels/channel-header";
import { CreateChannelModal } from "@/components/channels/create-channel-modal";
import { DeleteChannelModal } from "@/components/channels/delete-channel-modal";
import { EditChannelModal } from "@/components/channels/edit-channel-modal";
import { MembersSidebar } from "@/components/members/members-sidebar";
import { useAuth } from "@/services/auth/auth-context";
import { reorderCategoriesRequest } from "@/services/categories/client";
import {
  moveChannelToCategoryRequest,
  reorderChannelsRequest,
} from "@/services/channels/client";
import { listMemberRolesRequest } from "@/services/roles/client";
import { cn } from "@/lib/cn";

import { ServerSidebarHeader } from "./sidebar/server-sidebar-header";

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

/**
 * Vista de un servidor ya creado: header + canales reales agrupados por
 * categoria (con "sin categoria" como balde por default) y un placeholder de
 * "chat" -- todavia no hay servicio de mensajes, asi que no fingimos mensajes
 * reales, solo la estructura.
 */
export function ServerView({
  server,
  onLeft,
  onServerUpdate,
  ownProfile,
  onOpenOwnProfile,
}: ServerViewProps) {
  const { user } = useAuth();
  const isOwner = user !== null && String(user.id) === server.owner_id;
  const [myRoles, setMyRoles] = useState<Role[]>([]);

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

  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
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

  const sortedCategories = sortByPosition(server.categories);
  const uncategorized = channelsOfCategory(server.channels, null);

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

  /** A que bucket pertenece hoy un canal. */
  function bucketOfChannel(channel: Channel): string {
    return channel.category_id
      ? categoryBucket(channel.category_id)
      : UNCATEGORIZED_BUCKET;
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
    const categoryIds = reordered.map((c) => c.id);
    const previousCategories = server.categories;

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
      const targetCategoryId = bucketCategoryId(overBucket);
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
    const categoryId = bucketCategoryId(activeBucket);
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
        onClick={() => setActiveChannelId(channel.id)}
        onEdit={() => setEditingChannel(channel)}
        onDelete={() => setDeletingChannel(channel)}
      />
    ));
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Channel sidebar */}
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
          onLeft={onLeft}
          onCreateChannel={() => {
            setCreateChannelDefaultCategoryId(null);
            setIsCreateChannelOpen(true);
          }}
          onCreateCategory={() => setIsCreateCategoryOpen(true)}
          onServerUpdated={onServerUpdate}
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
              <div>
                <CategorySectionHeader
                  label="Sin categoría"
                  isCollapsed={collapsedIds.has("none")}
                  onToggle={() => toggleCollapsed("none")}
                  canManage={false}
                />
                {!collapsedIds.has("none") ? (
                  <CategoryDropZone
                    bucket={UNCATEGORIZED_BUCKET}
                    items={uncategorized.map((channel) => channel.id)}
                  >
                    {renderChannelList(uncategorized)}
                  </CategoryDropZone>
                ) : null}
              </div>
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

      {/* Content area */}
      <div
        className="flex flex-1 flex-col overflow-hidden"
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

            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
              <div className="from-accent-gradient-start to-accent-gradient-end flex size-14 items-center justify-center rounded-full bg-gradient-to-br">
                {activeChannel.kind === "text" ? (
                  <Hash size={26} className="text-white" />
                ) : (
                  <Volume2 size={26} className="text-white" />
                )}
              </div>
              <div>
                <h2 className="font-display text-content text-lg font-bold">
                  {activeChannel.kind === "text"
                    ? `Bienvenido a #${activeChannel.name}`
                    : `Canal de voz: ${activeChannel.name}`}
                </h2>
                <p className="text-content-muted mt-1 max-w-sm text-sm leading-relaxed">
                  {activeChannel.kind === "text"
                    ? CHANNEL_START_NOTICE
                    : VOICE_NOT_IMPLEMENTED}
                </p>
              </div>
            </div>

            {activeChannel.kind === "text" ? (
              <div className="px-4 pb-4">
                <div
                  className="bg-surface-input border-line text-content-subtle cursor-not-allowed rounded-lg border px-4 py-3 text-sm"
                  title="El chat todavía no está disponible"
                >
                  El chat todavía no está disponible
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      {isMembersVisible ? (
        <MembersSidebar
          key={`${server.id}:${server.owner_id}`}
          serverId={server.id}
          currentUserId={ownProfile?.id ?? user?.id ?? null}
          ownProfile={ownProfile}
          onOpenOwnProfile={onOpenOwnProfile}
          onOpenPublicProfile={setViewingUserId}
        />
      ) : null}

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
          onClose={() => setViewingUserId(null)}
        />
      ) : null}
    </div>
  );
}
