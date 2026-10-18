import { type Member, type MemberPageQuery } from "@discordia/client-shared";

import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useMemberPages } from "./useMemberPages";

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
  return vi.fn(async ({ limit = 15, offset = 0 }: MemberPageQuery) => ({
    ok: true as const,
    members: Array.from(
      { length: Math.max(0, Math.min(limit, total - offset)) },
      (_, index) => member(offset + index + 1),
    ),
    total,
  }));
}

describe("useMemberPages", () => {
  it("pide una pagina por vez al back y navega con setPage", async () => {
    const fetchPage = backWith(45);
    const { result } = renderHook(() =>
      useMemberPages({ fetchPage, search: "" }),
    );

    await waitFor(() => expect(result.current.members).toHaveLength(15));
    expect(result.current.pageCount).toBe(3);

    act(() => result.current.setPage(3));

    await waitFor(() => expect(result.current.members).toHaveLength(15));
    expect(fetchPage).toHaveBeenLastCalledWith({
      search: "",
      limit: 15,
      offset: 30,
    });
    expect(result.current.range).toEqual({ from: 31, to: 45 });
  });

  it("una busqueda nueva vuelve a la primera pagina sin pedir la vieja", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const fetchPage = backWith(45);
    const { result, rerender } = renderHook(
      ({ search }) => useMemberPages({ fetchPage, search }),
      { initialProps: { search: "" } },
    );
    await waitFor(() => expect(result.current.members).toHaveLength(15));
    act(() => result.current.setPage(2));
    await waitFor(() => expect(result.current.page).toBe(2));
    fetchPage.mockClear();

    rerender({ search: "ana" });
    expect(result.current.isSearchPending).toBe(true);
    await act(() => vi.advanceTimersByTimeAsync(300));

    await waitFor(() => expect(result.current.page).toBe(1));
    expect(fetchPage).toHaveBeenCalledTimes(1);
    expect(fetchPage).toHaveBeenCalledWith({
      search: "ana",
      limit: 15,
      offset: 0,
    });
    vi.useRealTimers();
  });

  it("no pide nada mientras no esta habilitado", () => {
    const fetchPage = backWith(5);
    renderHook(() => useMemberPages({ fetchPage, search: "", enabled: false }));
    expect(fetchPage).not.toHaveBeenCalled();
  });
});
