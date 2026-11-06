import {
  createSocketManager,
  UNREAD_SOCKET_EVENTS,
  type UnreadSnapshotPayload,
  unreadTopic,
  type UnreadUpdatedPayload,
} from "@discordia/client-shared";
import { type Channel, Socket } from "phoenix";

import { env } from "@/lib/env";

import { fetchUnreadSocketTicketRequest } from "./client";

export interface UnreadHandlers {
  snapshot: (payload: UnreadSnapshotPayload) => void;
  updated: (payload: UnreadUpdatedPayload) => void;
}

export interface UnreadConnection {
  markRead: (channelId: string) => void;
  disconnect: () => void;
}

const unreadSocket = createSocketManager({
  createSocket: (params) => new Socket(env.notificationsWsUrl, { params }),
  fetchTicket: fetchUnreadSocketTicketRequest,
  watchLifecycle: ({ suspendReconnect }) => {
    const onPageHide = () => suspendReconnect(true);
    const onPageShow = () => suspendReconnect(false);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("pageshow", onPageShow);
    };
  },
});

/**
 * Se une a `notifications:<userId>`. Al unirse (y al reconectar) el back
 * empuja un `snapshot` completo, así que no hace falta pedir nada por REST.
 */
export function connectUnread(
  userId: string,
  handlers: UnreadHandlers,
): UnreadConnection {
  let disposed = false;
  let channel: Channel | null = null;
  let release: (() => void) | null = null;

  void unreadSocket.acquireSocket().then((acquired) => {
    if (!acquired.ok) return;
    if (disposed) {
      acquired.release();
      return;
    }
    release = acquired.release;
    channel = acquired.socket.channel(unreadTopic(userId), {});
    channel.on(UNREAD_SOCKET_EVENTS.snapshot, handlers.snapshot);
    channel.on(UNREAD_SOCKET_EVENTS.updated, handlers.updated);
    channel.join();
  });

  return {
    markRead: (channelId) => {
      channel?.push(UNREAD_SOCKET_EVENTS.markRead, { channel_id: channelId });
    },
    disconnect: () => {
      disposed = true;
      channel?.leave();
      release?.();
    },
  };
}
