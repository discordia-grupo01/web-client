"use client";

import type { Channel } from "@discordia/client-shared";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Hash, MoreVertical, Pencil, Trash2, Volume2 } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/cn";

interface ChannelRowProps {
  channel: Channel;
  active: boolean;
  canManage: boolean;
  /** Menciones sin leer en este canal; con 0 no se muestra nada. */
  unreadMentions?: number;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function ChannelRow({
  channel,
  active,
  canManage,
  unreadMentions = 0,
  onClick,
  onEdit,
  onDelete,
}: ChannelRowProps) {
  const Icon = channel.kind === "text" ? Hash : Volume2;
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="group relative flex items-center">
      {unreadMentions > 0 ? (
        <span
          aria-hidden
          className="bg-content absolute top-1/2 left-0 h-2 w-1 -translate-y-1/2 rounded-r-full"
        />
      ) : null}
      <button
        type="button"
        onClick={onClick}
        title={
          unreadMentions > 0
            ? `${unreadMentions} menciones sin leer`
            : undefined
        }
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
        <span
          className={cn(
            "truncate",
            unreadMentions > 0 && !active && "text-content font-semibold",
          )}
        >
          {channel.name}
        </span>
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
