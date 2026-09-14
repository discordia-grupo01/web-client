"use client";

import {
  Hash,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
  Volume2,
} from "lucide-react";
import { useState } from "react";

import { CreateChannelModal } from "@/components/servers/create-channel-modal";
import { DeleteChannelModal } from "@/components/servers/delete-channel-modal";
import { EditChannelModal } from "@/components/servers/edit-channel-modal";
import { MembersSidebar } from "@/components/servers/members-sidebar";
import { ServerSidebarHeader } from "@/components/servers/server-sidebar-header";
import { useAuth } from "@/features/auth/auth-context";
import type { Channel, ServerSummary } from "@/features/servers/types";
import { cn } from "@/lib/cn";

interface ServerViewProps {
  server: ServerSummary;
  onLeft: () => void;
  onServerUpdate: (server: ServerSummary) => void;
}

function ChannelRow({
  channel,
  active,
  isOwner,
  onClick,
  onEdit,
  onDelete,
}: {
  channel: Channel;
  active: boolean;
  isOwner: boolean;
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
          "flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
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

      {isOwner ? (
        <>
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label="Opciones del canal"
            className="text-content-subtle hover:text-content absolute right-1 flex size-6 shrink-0 items-center justify-center rounded opacity-0 transition-opacity group-hover:opacity-100"
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
                  className="text-content hover:bg-surface-hover flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors"
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
                  className="text-danger hover:bg-danger/10 flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors"
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

/**
 * Vista de un servidor ya creado: header + canales reales (los 2 que vienen
 * por defecto) y un placeholder de "chat" -- todavia no hay servicio de
 * mensajes, asi que no fingimos mensajes reales, solo la estructura.
 */
export function ServerView({
  server,
  onLeft,
  onServerUpdate,
}: ServerViewProps) {
  const { user } = useAuth();
  const isOwner = user !== null && String(user.id) === server.owner_id;
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [deletingChannel, setDeletingChannel] = useState<Channel | null>(null);
  const textChannels = server.channels.filter(
    (channel) => channel.kind === "text",
  );
  const voiceChannels = server.channels.filter(
    (channel) => channel.kind === "voice",
  );
  const [activeChannelId, setActiveChannelId] = useState(
    () => textChannels[0]?.id ?? server.channels[0]?.id ?? "",
  );
  const activeChannel = server.channels.find(
    (channel) => channel.id === activeChannelId,
  );

  function handleChannelCreated(channel: Channel) {
    setIsCreateChannelOpen(false);
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

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Channel sidebar */}
      <div
        className="flex w-60 shrink-0 flex-col overflow-hidden"
        style={{ background: "var(--bg-channels)" }}
      >
        <ServerSidebarHeader server={server} onLeft={onLeft} />

        {isOwner ? (
          <button
            type="button"
            onClick={() => setIsCreateChannelOpen(true)}
            className="text-content-subtle hover:text-content hover:bg-surface-hover flex items-center gap-1.5 px-4 py-2 text-xs font-semibold transition-colors"
          >
            <Plus size={14} />
            Crear canal
          </button>
        ) : null}

        <div className="flex-1 space-y-4 overflow-y-auto px-2 py-3">
          {textChannels.length > 0 ? (
            <div>
              <p className="text-content-subtle mb-1 px-2 text-[11px] font-semibold tracking-wider uppercase">
                Canales de texto
              </p>
              <div className="space-y-0.5">
                {textChannels.map((channel) => (
                  <ChannelRow
                    key={channel.id}
                    channel={channel}
                    active={channel.id === activeChannelId}
                    isOwner={isOwner}
                    onClick={() => setActiveChannelId(channel.id)}
                    onEdit={() => setEditingChannel(channel)}
                    onDelete={() => setDeletingChannel(channel)}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {voiceChannels.length > 0 ? (
            <div>
              <p className="text-content-subtle mb-1 px-2 text-[11px] font-semibold tracking-wider uppercase">
                Canales de voz
              </p>
              <div className="space-y-0.5">
                {voiceChannels.map((channel) => (
                  <ChannelRow
                    key={channel.id}
                    channel={channel}
                    active={channel.id === activeChannelId}
                    isOwner={isOwner}
                    onClick={() => setActiveChannelId(channel.id)}
                    onEdit={() => setEditingChannel(channel)}
                    onDelete={() => setDeletingChannel(channel)}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Content area */}
      <div
        className="flex flex-1 flex-col overflow-hidden"
        style={{ background: "var(--bg-chat)" }}
      >
        {activeChannel ? (
          <>
            <div className="border-line flex h-12 shrink-0 items-center gap-2 border-b px-4">
              {activeChannel.kind === "text" ? (
                <Hash size={18} className="text-content-subtle" />
              ) : (
                <Volume2 size={18} className="text-content-subtle" />
              )}
              <span className="font-display text-content text-sm font-semibold">
                {activeChannel.name}
              </span>
            </div>

            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
              <div className="from-accent flex size-14 items-center justify-center rounded-full bg-gradient-to-br to-[#1a4050]">
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
                    ? "Este es el comienzo del canal. El chat todavía no está conectado en esta versión."
                    : "La conexión de voz todavía no está implementada en esta versión."}
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

      <MembersSidebar serverId={server.id} />

      {isCreateChannelOpen ? (
        <CreateChannelModal
          serverId={server.id}
          categories={server.categories}
          onClose={() => setIsCreateChannelOpen(false)}
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
    </div>
  );
}
