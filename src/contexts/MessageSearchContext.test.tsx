import {
  MESSAGE_SEARCH_EMPTY_QUERY,
  MESSAGE_SEARCH_TEXT_TOO_LONG,
} from "@discordia/client-shared";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MobilePanelsProvider } from "@/contexts/MobilePanelsContext";
import { searchMessagesRequest } from "@/services/messages/client";

import {
  MessageSearchProvider,
  useMessageSearchContext,
} from "@/contexts/MessageSearchContext";

vi.mock("@/services/messages/client", () => ({
  searchMessagesRequest: vi.fn(),
}));

const onOpenChange = vi.fn();
const onOpenResult = vi.fn();

function wrapper({ children }: { children: ReactNode }) {
  return (
    <MobilePanelsProvider>
      <MessageSearchProvider
        serverId="s1"
        serverName="Equipo"
        isOpen={false}
        onOpenChange={onOpenChange}
        onOpenResult={onOpenResult}
      >
        {children}
      </MessageSearchProvider>
    </MobilePanelsProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(searchMessagesRequest).mockResolvedValue({
    ok: true,
    messages: [],
    nextCursor: null,
    total: 0,
    totalCapped: false,
  });
});

describe("MessageSearchProvider", () => {
  it("sin texto ni autor no busca y explica por que", () => {
    const { result } = renderHook(useMessageSearchContext, { wrapper });

    act(() => result.current.submit());

    expect(result.current.validationError).toBe(MESSAGE_SEARCH_EMPTY_QUERY);
    expect(searchMessagesRequest).not.toHaveBeenCalled();
  });

  it("con un texto demasiado largo no busca", () => {
    const { result } = renderHook(useMessageSearchContext, { wrapper });

    act(() => result.current.setDraft("a".repeat(101)));
    act(() => result.current.submit());

    expect(result.current.validationError).toBe(MESSAGE_SEARCH_TEXT_TOO_LONG);
    expect(searchMessagesRequest).not.toHaveBeenCalled();
  });

  it("Enter busca el texto", () => {
    const { result } = renderHook(useMessageSearchContext, { wrapper });

    act(() => result.current.setDraft("deploy"));
    act(() => result.current.submit());

    expect(searchMessagesRequest).toHaveBeenCalledWith(
      "s1",
      { text: "deploy", authorId: null },
      null,
    );
  });

  it("Ctrl+K abre el panel y pide el foco del campo", () => {
    const { result } = renderHook(useMessageSearchContext, { wrapper });
    const before = result.current.focusToken;

    act(() => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "k", ctrlKey: true }),
      );
    });

    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(result.current.focusToken).toBe(before + 1);
  });

  it("CA 2: elegir un autor busca al instante, aunque no haya texto", () => {
    const { result } = renderHook(useMessageSearchContext, { wrapper });

    act(() => result.current.setAuthorId("beto"));

    expect(searchMessagesRequest).toHaveBeenCalledWith(
      "s1",
      { text: "", authorId: "beto" },
      null,
    );
  });

  it("sacar el autor sin texto vuelve al estado inicial", () => {
    const { result } = renderHook(useMessageSearchContext, { wrapper });
    act(() => result.current.setAuthorId("beto"));

    act(() => result.current.setAuthorId(null));

    expect(result.current.search.state.status).toBe("idle");
  });
});

describe("MessageSearchProvider: limpiar", () => {
  it("borra texto, autor y resultados, y cierra", () => {
    const { result } = renderHook(useMessageSearchContext, { wrapper });
    act(() => result.current.setDraft("deploy"));
    act(() => result.current.setAuthorId("beto"));

    act(() => result.current.clear());

    expect(result.current.draft).toBe("");
    expect(result.current.authorId).toBeNull();
    expect(result.current.search.state.status).toBe("idle");
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });
});
