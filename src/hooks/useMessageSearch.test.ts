import type { Message, SearchMessagesResult } from "@discordia/client-shared";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { searchMessagesRequest } from "@/services/messages/client";

import { useMessageSearch } from "./useMessageSearch";

vi.mock("@/services/messages/client", () => ({
  searchMessagesRequest: vi.fn(),
}));

function message(id: string): Message {
  return {
    id,
    channel_id: "c1",
    server_id: "s1",
    user_id: "u1",
    content: `deploy ${id}`,
    inserted_at: "2026-10-25T03:00:00.000Z",
  };
}

function page(
  ids: string[],
  nextCursor: string | null,
  total: number | null = null,
): SearchMessagesResult {
  return {
    ok: true,
    messages: ids.map(message),
    nextCursor,
    total,
    totalCapped: false,
  };
}

const QUERY = { text: "deploy", authorId: null };

beforeEach(() => {
  vi.mocked(searchMessagesRequest).mockReset();
});

describe("useMessageSearch", () => {
  it("busca la primera pagina y expone resultados, total y paginas", async () => {
    vi.mocked(searchMessagesRequest).mockResolvedValueOnce(
      page(["m2", "m1"], "m1", 30),
    );
    const { result } = renderHook(() => useMessageSearch("s1"));

    act(() => result.current.search({ text: " deploy ", authorId: null }));
    expect(result.current.state.status).toBe("loading");

    await waitFor(() => expect(result.current.state.status).toBe("ready"));
    expect(searchMessagesRequest).toHaveBeenCalledWith("s1", QUERY, null);
    expect(result.current.results.map((m) => m.id)).toEqual(["m2", "m1"]);
    expect(result.current.pageCount).toBe(2);
  });

  it("CA 3: una busqueda sin coincidencias queda vacia", async () => {
    vi.mocked(searchMessagesRequest).mockResolvedValueOnce(page([], null, 0));
    const { result } = renderHook(() => useMessageSearch("s1"));

    act(() => result.current.search(QUERY));

    await waitFor(() => expect(result.current.isEmpty).toBe(true));
  });

  it("la pagina siguiente se pide con el cursor de la anterior", async () => {
    vi.mocked(searchMessagesRequest)
      .mockResolvedValueOnce(page(["a"], "a", 30))
      .mockResolvedValueOnce(page(["b"], null));
    const { result } = renderHook(() => useMessageSearch("s1"));
    act(() => result.current.search(QUERY));
    await waitFor(() => expect(result.current.state.status).toBe("ready"));

    act(() => result.current.goToPage(2));

    await waitFor(() => expect(result.current.state.page).toBe(2));
    expect(searchMessagesRequest).toHaveBeenLastCalledWith("s1", QUERY, "a");
    expect(result.current.results.map((m) => m.id)).toEqual(["b"]);
  });

  it("ignora la respuesta de una busqueda que ya se reemplazo", async () => {
    let resolveFirst: (value: SearchMessagesResult) => void = () => {};
    vi.mocked(searchMessagesRequest)
      .mockImplementationOnce(
        () => new Promise((resolve) => (resolveFirst = resolve)),
      )
      .mockResolvedValueOnce(page(["nuevo"], null, 1));
    const { result } = renderHook(() => useMessageSearch("s1"));

    act(() => result.current.search(QUERY));
    act(() => result.current.search({ text: "release", authorId: null }));
    await waitFor(() => expect(result.current.state.status).toBe("ready"));
    await act(async () => resolveFirst(page(["viejo"], null, 1)));

    expect(result.current.results.map((m) => m.id)).toEqual(["nuevo"]);
  });

  it("reintentar despues de un fallo vuelve a pedir la misma busqueda", async () => {
    vi.mocked(searchMessagesRequest)
      .mockResolvedValueOnce({ ok: false, message: "falló" })
      .mockResolvedValueOnce(page(["a"], null, 1));
    const { result } = renderHook(() => useMessageSearch("s1"));
    act(() => result.current.search(QUERY));
    await waitFor(() => expect(result.current.state.status).toBe("error"));

    act(() => result.current.retry());

    await waitFor(() => expect(result.current.state.status).toBe("ready"));
    expect(result.current.results.map((m) => m.id)).toEqual(["a"]);
  });
});
