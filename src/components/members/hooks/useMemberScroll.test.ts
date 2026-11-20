import { DEFAULT_PAGE_SIZE as PAGE } from "@discordia/client-shared";
import { type Member, type MemberPageQuery } from "@discordia/client-shared";

import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useMemberScroll } from "@/components/members/hooks/useMemberScroll";

vi.mock("@/services/profile/client", () => ({
  getPublicProfileRequest: vi.fn(),
}));

const member = (id: number): Member => ({
  user_id: `u${id}`,
  is_owner: false,
  joined_at: "",
  profile: {
    name: `Usuario ${id}`,
    avatar_url: "",
    description: "",
    status_text: "",
    status_emoji: "",
  },
});

function backWith(total: number) {
  return vi.fn(async ({ limit = PAGE, offset = 0 }: MemberPageQuery) => ({
    ok: true as const,
    members: Array.from(
      { length: Math.max(0, Math.min(limit, total - offset)) },
      (_, index) => member(offset + index + 1),
    ),
    total,
  }));
}

describe("useMemberScroll", () => {
  it("suma la pagina siguiente al final hasta llegar al total", async () => {
    const fetchPage = backWith(PAGE + 5);
    const { result } = renderHook(() => useMemberScroll({ fetchPage }));
    await waitFor(() => expect(result.current.members).toHaveLength(PAGE));
    expect(result.current.hasMore).toBe(true);

    act(() => result.current.loadMore());

    await waitFor(() => expect(result.current.members).toHaveLength(PAGE + 5));
    expect(fetchPage).toHaveBeenLastCalledWith({
      search: "",
      limit: PAGE,
      offset: PAGE,
    });
    expect(result.current.hasMore).toBe(false);
  });

  it("no pide la misma pagina dos veces si se llama seguido", async () => {
    const fetchPage = backWith(60);
    const { result } = renderHook(() => useMemberScroll({ fetchPage }));
    await waitFor(() => expect(result.current.members).toHaveLength(PAGE));

    act(() => {
      result.current.loadMore();
      result.current.loadMore();
      result.current.loadMore();
    });

    await waitFor(() => expect(result.current.members).toHaveLength(PAGE * 2));
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });

  it("si alguien entro y se corrio el offset, no repite miembros", async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        members: [member(1), member(2)],
        total: 4,
      })
      .mockResolvedValueOnce({
        ok: true,
        members: [member(2), member(3)],
        total: 4,
      });
    const { result } = renderHook(() =>
      useMemberScroll({ fetchPage, pageSize: 2 }),
    );
    await waitFor(() => expect(result.current.members).toHaveLength(2));

    act(() => result.current.loadMore());

    await waitFor(() =>
      expect(result.current.members?.map((m) => m.user_id)).toEqual([
        "u1",
        "u2",
        "u3",
      ]),
    );
  });

  it("una busqueda vuelve a la primera pagina y reemplaza la lista", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const fetchPage = backWith(60);
    const { result, rerender } = renderHook(
      ({ search }) => useMemberScroll({ fetchPage, search }),
      { initialProps: { search: "" } },
    );
    await waitFor(() => expect(result.current.members).toHaveLength(PAGE));
    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.members).toHaveLength(PAGE * 2));

    rerender({ search: "ana" });
    await act(() => vi.advanceTimersByTimeAsync(300));

    await waitFor(() => expect(result.current.members).toHaveLength(PAGE));
    expect(fetchPage).toHaveBeenLastCalledWith({
      search: "ana",
      limit: PAGE,
      offset: 0,
    });
    expect(result.current.isSearching).toBe(true);
    vi.useRealTimers();
  });
});
