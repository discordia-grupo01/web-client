import {
  NOTIFICATION_HISTORY_PAGE_SIZE,
  type NotificationHistoryItem,
} from "@discordia/client-shared";

import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const listNotificationHistoryRequest = vi.fn();

vi.mock("@/services/notifications/client", () => ({
  listNotificationHistoryRequest: (...args: unknown[]) =>
    listNotificationHistoryRequest(...args),
}));

import { useNotificationHistory } from "@/hooks/useNotificationHistory";

const item = (messageId: string): NotificationHistoryItem => ({
  kind: "mention",
  message_id: messageId,
  author_id: "author",
  occurred_at: "2026-11-02T12:00:00Z",
  server_id: "s1",
  channel_id: "c1",
  conversation_id: null,
});

const page = (ids: string[], nextCursor: string | null) => ({
  ok: true,
  items: ids.map(item),
  nextCursor,
});

describe("useNotificationHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("al montar pide la primera pagina con el tamano acordado", async () => {
    listNotificationHistoryRequest.mockResolvedValue(page(["m2", "m1"], null));

    const { result } = renderHook(() => useNotificationHistory());

    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(listNotificationHistoryRequest).toHaveBeenCalledWith({
      limit: NOTIFICATION_HISTORY_PAGE_SIZE,
    });
    expect(result.current.items.map((entry) => entry.message_id)).toEqual([
      "m2",
      "m1",
    ]);
    expect(result.current.hasMore).toBe(false);
  });

  it("sin notificaciones queda listo y vacio", async () => {
    listNotificationHistoryRequest.mockResolvedValue(page([], null));

    const { result } = renderHook(() => useNotificationHistory());

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.items).toEqual([]);
    expect(result.current.hasMore).toBe(false);
  });

  it("loadMore pide la pagina siguiente con el cursor y la agrega al final", async () => {
    listNotificationHistoryRequest
      .mockResolvedValueOnce(page(["m3", "m2"], "m2"))
      .mockResolvedValueOnce(page(["m1"], null));

    const { result } = renderHook(() => useNotificationHistory());
    await waitFor(() => expect(result.current.hasMore).toBe(true));

    act(() => result.current.loadMore());

    await waitFor(() => expect(result.current.hasMore).toBe(false));
    expect(listNotificationHistoryRequest).toHaveBeenLastCalledWith({
      limit: NOTIFICATION_HISTORY_PAGE_SIZE,
      before: "m2",
    });
    expect(result.current.items.map((entry) => entry.message_id)).toEqual([
      "m3",
      "m2",
      "m1",
    ]);
  });

  it("no repite una entrada que llega en dos paginas", async () => {
    listNotificationHistoryRequest
      .mockResolvedValueOnce(page(["m3", "m2"], "m2"))
      .mockResolvedValueOnce(page(["m2", "m1"], null));

    const { result } = renderHook(() => useNotificationHistory());
    await waitFor(() => expect(result.current.hasMore).toBe(true));

    act(() => result.current.loadMore());

    await waitFor(() => expect(result.current.items).toHaveLength(3));
    expect(result.current.items.map((entry) => entry.message_id)).toEqual([
      "m3",
      "m2",
      "m1",
    ]);
  });

  it("una pagina vacia con cursor deja seguir pidiendo", async () => {
    listNotificationHistoryRequest
      .mockResolvedValueOnce(page([], "m5"))
      .mockResolvedValueOnce(page(["m4"], null));

    const { result } = renderHook(() => useNotificationHistory());
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.hasMore).toBe(true);

    act(() => result.current.loadMore());

    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(result.current.hasMore).toBe(false);
  });

  it("sin cursor loadMore no pide nada", async () => {
    listNotificationHistoryRequest.mockResolvedValue(page(["m1"], null));

    const { result } = renderHook(() => useNotificationHistory());
    await waitFor(() => expect(result.current.status).toBe("ready"));

    act(() => result.current.loadMore());

    expect(listNotificationHistoryRequest).toHaveBeenCalledTimes(1);
  });

  it("un loadMore en curso no dispara otro pedido", async () => {
    let resolveSecond: (value: unknown) => void = () => undefined;
    listNotificationHistoryRequest
      .mockResolvedValueOnce(page(["m2"], "m2"))
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveSecond = resolve;
        }),
      );

    const { result } = renderHook(() => useNotificationHistory());
    await waitFor(() => expect(result.current.hasMore).toBe(true));

    act(() => {
      result.current.loadMore();
      result.current.loadMore();
    });

    expect(listNotificationHistoryRequest).toHaveBeenCalledTimes(2);
    expect(result.current.isLoadingMore).toBe(true);

    await act(async () => resolveSecond(page(["m1"], null)));
    expect(result.current.isLoadingMore).toBe(false);
  });

  it("si falla la primera pagina muestra el error y reload lo reintenta", async () => {
    listNotificationHistoryRequest
      .mockResolvedValueOnce({ ok: false, message: "No se pudo" })
      .mockResolvedValueOnce(page(["m1"], null));

    const { result } = renderHook(() => useNotificationHistory());

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error).toBe("No se pudo");

    await act(async () => {
      await result.current.reload();
    });

    expect(result.current.status).toBe("ready");
    expect(result.current.error).toBeNull();
    expect(result.current.items).toHaveLength(1);
  });

  it("si falla una pagina siguiente conserva lo cargado y permite reintentar", async () => {
    listNotificationHistoryRequest
      .mockResolvedValueOnce(page(["m2"], "m2"))
      .mockResolvedValueOnce({ ok: false, message: "Fallo la pagina" })
      .mockResolvedValueOnce(page(["m1"], null));

    const { result } = renderHook(() => useNotificationHistory());
    await waitFor(() => expect(result.current.hasMore).toBe(true));

    act(() => result.current.loadMore());
    await waitFor(() =>
      expect(result.current.loadMoreError).toBe("Fallo la pagina"),
    );
    expect(result.current.status).toBe("ready");
    expect(result.current.items).toHaveLength(1);
    expect(result.current.hasMore).toBe(true);

    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.items).toHaveLength(2));
    expect(result.current.loadMoreError).toBeNull();
  });

  it("descarta la respuesta de una pagina que llega despues de recargar", async () => {
    let resolveStale: (value: unknown) => void = () => undefined;
    listNotificationHistoryRequest
      .mockResolvedValueOnce(page(["m3"], "m3"))
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveStale = resolve;
        }),
      )
      .mockResolvedValueOnce(page(["m9"], null));

    const { result } = renderHook(() => useNotificationHistory());
    await waitFor(() => expect(result.current.hasMore).toBe(true));

    act(() => result.current.loadMore());
    await act(async () => {
      await result.current.reload();
    });
    await act(async () => resolveStale(page(["m1"], null)));

    expect(result.current.items.map((entry) => entry.message_id)).toEqual([
      "m9",
    ]);
    expect(result.current.hasMore).toBe(false);
  });
  describe("refresh", () => {
    it("agrega arriba lo nuevo y conserva lo ya cargado y su cursor", async () => {
      listNotificationHistoryRequest
        .mockResolvedValueOnce(page(["m3", "m2"], "m2"))
        .mockResolvedValueOnce(page(["m1"], null))
        .mockResolvedValueOnce(page(["m4", "m3"], "m3"));

      const { result } = renderHook(() => useNotificationHistory());
      await waitFor(() => expect(result.current.hasMore).toBe(true));
      act(() => result.current.loadMore());
      await waitFor(() => expect(result.current.items).toHaveLength(3));
      expect(result.current.hasMore).toBe(false);

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.items.map((entry) => entry.message_id)).toEqual([
        "m4",
        "m3",
        "m2",
        "m1",
      ]);
      expect(result.current.hasMore).toBe(false);
      expect(listNotificationHistoryRequest).toHaveBeenLastCalledWith({
        limit: NOTIFICATION_HISTORY_PAGE_SIZE,
      });
    });

    it("avisa si trajo algo nuevo", async () => {
      listNotificationHistoryRequest
        .mockResolvedValueOnce(page(["m1"], null))
        .mockResolvedValueOnce(page(["m2", "m1"], null));

      const { result } = renderHook(() => useNotificationHistory());
      await waitFor(() => expect(result.current.status).toBe("ready"));

      let found: boolean | undefined;
      await act(async () => {
        found = await result.current.refresh();
      });

      expect(found).toBe(true);
    });

    it("avisa que no hay nada nuevo si todo ya estaba", async () => {
      listNotificationHistoryRequest
        .mockResolvedValueOnce(page(["m2", "m1"], null))
        .mockResolvedValueOnce(page(["m2", "m1"], null));

      const { result } = renderHook(() => useNotificationHistory());
      await waitFor(() => expect(result.current.status).toBe("ready"));

      let found: boolean | undefined;
      await act(async () => {
        found = await result.current.refresh();
      });

      expect(found).toBe(false);
    });

    it("avisa que no hay nada nuevo si el pedido falla", async () => {
      listNotificationHistoryRequest
        .mockResolvedValueOnce(page(["m1"], null))
        .mockResolvedValueOnce({ ok: false, message: "No se pudo" });

      const { result } = renderHook(() => useNotificationHistory());
      await waitFor(() => expect(result.current.status).toBe("ready"));

      let found: boolean | undefined;
      await act(async () => {
        found = await result.current.refresh();
      });

      expect(found).toBe(false);
    });

    it("no repite lo que ya estaba", async () => {
      listNotificationHistoryRequest
        .mockResolvedValueOnce(page(["m2", "m1"], null))
        .mockResolvedValueOnce(page(["m2", "m1"], null));

      const { result } = renderHook(() => useNotificationHistory());
      await waitFor(() => expect(result.current.status).toBe("ready"));

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.items).toHaveLength(2);
    });

    it("si falla no toca lo que se ve ni muestra un error", async () => {
      listNotificationHistoryRequest
        .mockResolvedValueOnce(page(["m1"], null))
        .mockResolvedValueOnce({ ok: false, message: "No se pudo" });

      const { result } = renderHook(() => useNotificationHistory());
      await waitFor(() => expect(result.current.status).toBe("ready"));

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.status).toBe("ready");
      expect(result.current.error).toBeNull();
      expect(result.current.items).toHaveLength(1);
    });

    it("si la primera carga habia fallado, refrescar la reintenta", async () => {
      listNotificationHistoryRequest
        .mockResolvedValueOnce({ ok: false, message: "No se pudo" })
        .mockResolvedValueOnce(page(["m1"], null));

      const { result } = renderHook(() => useNotificationHistory());
      await waitFor(() => expect(result.current.status).toBe("error"));

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.status).toBe("ready");
      expect(result.current.items).toHaveLength(1);
    });

    it("descarta una respuesta que llega despues de recargar", async () => {
      let resolveStale: (value: unknown) => void = () => undefined;
      listNotificationHistoryRequest
        .mockResolvedValueOnce(page(["m3"], null))
        .mockReturnValueOnce(
          new Promise((resolve) => {
            resolveStale = resolve;
          }),
        )
        .mockResolvedValueOnce(page(["m9"], null));

      const { result } = renderHook(() => useNotificationHistory());
      await waitFor(() => expect(result.current.status).toBe("ready"));

      let pending: Promise<unknown> = Promise.resolve();
      act(() => {
        pending = result.current.refresh();
      });
      await act(async () => {
        await result.current.reload();
      });
      await act(async () => {
        resolveStale(page(["m1"], null));
        await pending;
      });

      expect(result.current.items.map((entry) => entry.message_id)).toEqual([
        "m9",
      ]);
    });
  });
});
