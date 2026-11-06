"use client";

import {
  type Channel,
  DELETE_CHANNEL_LABEL,
  EDIT_CHANNEL_LABEL,
  NOTIFICATION_SETTINGS_MENU_LABEL,
  NOTIFICATION_SETTINGS_MUTED_TITLE,
  OVERRIDE_CHANNEL_PERMISSIONS_LABEL,
  NO_UNREAD_FLAGS,
  UNREAD_MESSAGES_LABEL,
  type UnreadFlags,
} from "@discordia/client-shared";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Bell,
  BellOff,
  Hash,
  MoreVertical,
  Pencil,
  ShieldCheck,
  Trash2,
  Volume2,
  type LucideIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { CountBadge } from "@/components/ui/CountBadge";
import { CallDuration } from "@/components/voice/CallDuration";
import { cn } from "@/lib/cn";

interface ChannelRowProps {
  channel: Channel;
  active: boolean;
  canManage: boolean;
  canManagePermissions?: boolean;
  unread?: UnreadFlags;
  isMuted?: boolean;
  onNotifications?: () => void;
  onClick: () => void;
  onEdit: () => void;
  onEditPermissions?: () => void;
  onDelete: () => void;
  isVoiceConnected?: boolean;
  callStartedAt?: number;
  children?: ReactNode;
}

function MenuItem({
  icon: Icon,
  label,
  isDanger = false,
  onSelect,
}: {
  icon: LucideIcon;
  label: string;
  isDanger?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full cursor-pointer items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors",
        isDanger
          ? "text-danger hover:bg-danger/10"
          : "text-content hover:bg-surface-hover",
      )}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}

function ChannelRow({
  channel,
  active,
  canManage,
  canManagePermissions = false,
  unread = NO_UNREAD_FLAGS,
  isMuted = false,
  onNotifications,
  onClick,
  onEdit,
  onEditPermissions,
  onDelete,
  isVoiceConnected = false,
  callStartedAt,
  children,
}: ChannelRowProps) {
  const Icon = channel.kind === "text" ? Hash : Volume2;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const hasMenu =
    canManage || canManagePermissions || onNotifications !== undefined;
  const { mentionCount } = unread;
  const isUnread = unread.unread && !active;

  return (
    <div>
      <div className="group relative flex items-center">
        {isUnread ? (
          <span
            aria-hidden
            className="bg-content absolute top-1/2 left-0 h-2 w-1 -translate-y-1/2 rounded-r-full"
          />
        ) : null}
        <button
          type="button"
          onClick={onClick}
          title={
            isUnread && mentionCount === 0 ? UNREAD_MESSAGES_LABEL : undefined
          }
          className={cn(
            "flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
            isVoiceConnected
              ? cn("text-success bg-success/10", active && "bg-success/20")
              : active
                ? "text-content bg-accent/20"
                : "text-content-muted hover:bg-surface-hover",
          )}
        >
          <Icon
            size={16}
            className={
              isVoiceConnected
                ? "text-success"
                : active
                  ? "text-accent"
                  : "text-content-subtle"
            }
          />
          <span
            className={cn(
              "min-w-0 truncate",
              isUnread && "text-content font-semibold",
            )}
          >
            {channel.name}
          </span>
          {isMuted ? (
            <BellOff
              size={12}
              aria-label={NOTIFICATION_SETTINGS_MUTED_TITLE}
              className="text-content-subtle shrink-0"
            />
          ) : null}
          {mentionCount > 0 ? (
            <CountBadge
              count={mentionCount}
              label={`${mentionCount} menciones sin leer`}
              className={cn(
                "ml-auto transition-opacity",
                hasMenu && "group-hover:opacity-0",
              )}
            />
          ) : null}
          {callStartedAt !== undefined ? (
            <CallDuration
              startedAt={callStartedAt}
              className={cn(
                "ml-auto text-xs transition-opacity",
                hasMenu && "group-hover:opacity-0",
              )}
            />
          ) : null}
        </button>

        {hasMenu ? (
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
                <div className="bg-surface-raised border-line absolute top-full right-0 z-50 mt-1 w-52 overflow-hidden rounded-xl border shadow-2xl">
                  {onNotifications ? (
                    <MenuItem
                      icon={Bell}
                      label={NOTIFICATION_SETTINGS_MENU_LABEL}
                      onSelect={() => {
                        setIsMenuOpen(false);
                        onNotifications();
                      }}
                    />
                  ) : null}
                  {canManage ? (
                    <MenuItem
                      icon={Pencil}
                      label={EDIT_CHANNEL_LABEL}
                      onSelect={() => {
                        setIsMenuOpen(false);
                        onEdit();
                      }}
                    />
                  ) : null}
                  {canManagePermissions && onEditPermissions ? (
                    <MenuItem
                      icon={ShieldCheck}
                      label={OVERRIDE_CHANNEL_PERMISSIONS_LABEL}
                      onSelect={() => {
                        setIsMenuOpen(false);
                        onEditPermissions();
                      }}
                    />
                  ) : null}
                  {canManage ? (
                    <MenuItem
                      icon={Trash2}
                      label={DELETE_CHANNEL_LABEL}
                      isDanger
                      onSelect={() => {
                        setIsMenuOpen(false);
                        onDelete();
                      }}
                    />
                  ) : null}
                </div>
              </>
            ) : null}
          </>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export function SortableChannelRow(props: ChannelRowProps) {
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
