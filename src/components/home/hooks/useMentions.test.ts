import {
  type MentionEventPayload,
  NO_NOTIFICATION_SETTINGS,
  type NotificationSettings,
  type UserMention,
} from "@discordia/client-shared";

import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const listUnreadMentionsRequest = vi.fn();
const markChannelMentionsReadRequest = vi.fn();

vi.mock("@/services/mentions/client", () => ({
  listUnreadMentionsRequest: (...args: unknown[]) =>
    listUnreadMentionsRequest(...args),
  markChannelMentionsReadRequest: (...args: unknown[]) =>
    markChannelMentionsReadRequest(...args),
}));

import { useMentions } from "@/components/home/hooks/useMentions";

const stored = (messageId: string, channelId: string, serverId: string) =>
  ({
    id: `${messageId}:me`,
    message_id: messageId,
    channel_id: channelId,
    server_id: serverId,
  }) as UserMention;

const live = (messageId: string, channelId: string, serverId: string) =>
  ({
    server_id: serverId,
    channel_id: channelId,
    message: { id: messageId },
  }) as MentionEventPayload;

describe("useMentions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listUnreadMentionsRequest.mockResolvedValue({ ok: true, mentions: [] });
    markChannelMentionsReadRequest.mockResolvedValue({ ok: true });
  });

  it("al montar trae las sin leer del back (asi sobreviven a recargar)", async () => {
    listUnreadMentionsRequest.mockResolvedValue({
      ok: true,
      mentions: [stored("m1", "c1", "s1"), stored("m2", "c1", "s1")],
    });

    const { result } = renderHook(() => useMentions("me"));

    await waitFor(() => expect(result.current.byChannel).toEqual({ c1: 2 }));
    expect(result.current.byServer).toEqual({ s1: 2 });
  });

  it("sin usuario todavia no pide nada", () => {
    renderHook(() => useMentions(null));
    expect(listUnreadMentionsRequest).not.toHaveBeenCalled();
  });

  it("suma las que llegan en vivo y no cuenta dos veces la misma", async () => {
    const { result } = renderHook(() => useMentions("me"));
    await waitFor(() => expect(listUnreadMentionsRequest).toHaveBeenCalled());

    act(() => result.current.receive(live("m1", "c1", "s1")));
    act(() => result.current.receive(live("m1", "c1", "s1")));

    expect(result.current.byChannel).toEqual({ c1: 1 });
  });

  it("marcar un canal como leido limpia su contador y avisa al back", async () => {
    const { result } = renderHook(() => useMentions("me"));
    act(() => result.current.receive(live("m1", "c1", "s1")));
    act(() => result.current.receive(live("m2", "c2", "s1")));

    act(() => result.current.markChannelRead("c1"));

    expect(result.current.byChannel).toEqual({ c2: 1 });
    expect(markChannelMentionsReadRequest).toHaveBeenCalledWith("c1");
  });

  it("si falla la carga inicial queda sin contadores", async () => {
    listUnreadMentionsRequest.mockResolvedValue({ ok: false, message: "x" });

    const { result } = renderHook(() => useMentions("me"));
    await waitFor(() => expect(listUnreadMentionsRequest).toHaveBeenCalled());

    expect(result.current.byChannel).toEqual({});
  });
  it("isUnread dice si una mencion concreta sigue sin leer", async () => {
    listUnreadMentionsRequest.mockResolvedValue({
      ok: true,
      mentions: [stored("m1", "c1", "s1")],
    });

    const { result } = renderHook(() => useMentions("me"));

    await waitFor(() => expect(result.current.isUnread("m1")).toBe(true));
    expect(result.current.isUnread("m2")).toBe(false);

    act(() => result.current.markChannelRead("c1"));

    expect(result.current.isUnread("m1")).toBe(false);
  });

  describe("con preferencias de notificacion", () => {
    const settings = (
      overrides: Partial<NotificationSettings>,
    ): NotificationSettings => ({ ...NO_NOTIFICATION_SETTINGS, ...overrides });

    async function renderMentions(current?: NotificationSettings) {
      listUnreadMentionsRequest.mockResolvedValue({
        ok: true,
        mentions: [
          stored("m1", "c1", "s1"),
          stored("m2", "c2", "s1"),
          stored("m3", "c3", "s2"),
        ],
      });
      const hook = renderHook(() => useMentions("me", current));
      await waitFor(() => expect(hook.result.current.isLoaded).toBe(true));
      return hook;
    }

    it("sin preferencias cuenta todas las menciones sin leer", async () => {
      const { result } = await renderMentions();

      expect(result.current.byChannel).toEqual({ c1: 1, c2: 1, c3: 1 });
      expect(result.current.byServer).toEqual({ s1: 2, s2: 1 });
    });

    it("un canal silenciado no suma a los contadores", async () => {
      const { result } = await renderMentions(
        settings({ mutedChannels: { c1: true } }),
      );

      expect(result.current.byChannel).toEqual({ c2: 1, c3: 1 });
      expect(result.current.byServer).toEqual({ s1: 1, s2: 1 });
    });

    it("un servidor silenciado no muestra ninguna de sus menciones", async () => {
      const { result } = await renderMentions(
        settings({ mutedServers: { s1: true } }),
      );

      expect(result.current.byChannel).toEqual({ c3: 1 });
      expect(result.current.byServer).toEqual({ s2: 1 });
    });

    it("el nivel nada tambien apaga el aviso del canal", async () => {
      const { result } = await renderMentions(
        settings({ channelLevels: { c2: "none" } }),
      );

      expect(result.current.byChannel).toEqual({ c1: 1, c3: 1 });
    });

    it("una mencion silenciada sigue figurando como sin leer", async () => {
      const { result } = await renderMentions(
        settings({ mutedServers: { s1: true } }),
      );

      expect(result.current.isUnread("m1")).toBe(true);
      expect(result.current.isUnread("m3")).toBe(true);
    });
  });
});
