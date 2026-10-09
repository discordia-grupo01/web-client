import type {
  MentionEventPayload,
  UserMention,
} from "@discordia/client-shared";

import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const listUnreadMentionsRequest = vi.fn();
const markChannelMentionsReadRequest = vi.fn();

vi.mock("./client", () => ({
  listUnreadMentionsRequest: (...args: unknown[]) =>
    listUnreadMentionsRequest(...args),
  markChannelMentionsReadRequest: (...args: unknown[]) =>
    markChannelMentionsReadRequest(...args),
}));

import { useMentions } from "./useMentions";

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
});
