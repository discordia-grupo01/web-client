import type { ServerEmoji } from "@discordia/client-shared";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("./MessageEditor", () => import("./MessageEditor.fake"));

vi.mock("@/services/attachments/client", () => ({
  uploadAttachmentRequest: vi.fn(),
}));

vi.mock("@/utils/settingsRequest", () => ({
  openSettingsSection: vi.fn(),
}));

vi.mock("@/services/emojis/client", () => ({
  listServerEmojisRequest: (...args: unknown[]) =>
    listServerEmojisRequest(...args),
}));

/**
 * El selector real es emoji-mart, que vive en un shadow DOM y se carga aparte.
 * Acá se reemplaza por dos botones que llaman a lo mismo que llamaría él.
 */
vi.mock("./EmojiPicker", () => ({
  EmojiPicker: ({
    onPickCustom,
    onOpenChange,
    lockedTooltips,
  }: {
    onPickCustom?: (id: string) => void;
    onOpenChange?: (isOpen: boolean) => void;
    lockedTooltips?: string[];
  }) => (
    <>
      <button type="button" onClick={() => onOpenChange?.(true)}>
        abrir selector
      </button>
      <button type="button" onClick={() => onPickCustom?.("e-mate")}>
        elegir mate
      </button>
      <button type="button" onClick={() => onPickCustom?.("e-festejo")}>
        elegir festejo
      </button>
      <span data-testid="bloqueados">{(lockedTooltips ?? []).join(",")}</span>
    </>
  ),
}));

import { OwnProfileProvider } from "@/contexts/OwnProfileContext";
import { ServerEmojisProvider } from "@/contexts/ServerEmojisContext";

import { MessageComposer } from "./MessageComposer";

const listServerEmojisRequest = vi.fn();

const emoji = (id: string, name: string, animated: boolean): ServerEmoji => ({
  id,
  server_id: "s1",
  name,
  animated,
  image_url: `https://cdn.test/${name}.png`,
  created_by: "u1",
  created_at: "2026-11-03T12:00:00Z",
});

function renderComposer(premium: boolean) {
  listServerEmojisRequest.mockResolvedValue({
    ok: true,
    page: {
      emojis: [
        emoji("e-mate", "mate", false),
        emoji("e-festejo", "festejo", true),
      ],
      max_emojis: 50,
    },
  });
  const onSend = vi.fn();

  render(
    <OwnProfileProvider
      value={{
        profile: { id: "u1", name: "Juana", premium } as never,
        refresh: vi.fn(),
      }}
    >
      <ServerEmojisProvider
        servers={[{ id: "s1", name: "Física", icon_url: null }]}
      >
        <MessageComposer
          placeholder="Mensaje en #general"
          onSend={onSend}
          uploadTarget={{ channelId: "c1" }}
          server={{ id: "s1", name: "Física", icon_url: null }}
        />
      </ServerEmojisProvider>
    </OwnProfileProvider>,
  );

  return { onSend, input: screen.getByRole("textbox") };
}

async function openPicker() {
  await userEvent.click(screen.getByRole("button", { name: "abrir selector" }));
  await waitFor(() =>
    expect(listServerEmojisRequest).toHaveBeenCalledWith("s1"),
  );
}

describe("emojis del servidor en el compositor", () => {
  it("no pide los emojis hasta que se abre el selector", () => {
    renderComposer(false);
    expect(listServerEmojisRequest).not.toHaveBeenCalled();
  });

  it("elegir uno propio escribe `:mate:` y manda el token", async () => {
    const { onSend, input } = renderComposer(false);
    await openPicker();

    await userEvent.click(screen.getByRole("button", { name: "elegir mate" }));

    // En el cuadro de texto se lee el nombre, nunca el id.
    await waitFor(() => expect(input).toHaveValue(":mate:"));
    await userEvent.type(input, "{Enter}");

    expect(onSend).toHaveBeenCalledWith("<:mate:e-mate>", []);
  });

  it("sin Premium, el animado no se escribe y aparece la oferta", async () => {
    const { input } = renderComposer(false);
    await openPicker();

    await waitFor(() =>
      expect(screen.getByTestId("bloqueados")).toHaveTextContent(
        "Necesitás Premium para usarlo",
      ),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "elegir festejo" }),
    );

    expect(input).toHaveValue("");
    expect(
      screen.getByText("Los emojis animados son de Premium"),
    ).toBeInTheDocument();
  });

  it("con Premium, el animado se escribe con la marca `a`", async () => {
    const { onSend, input } = renderComposer(true);
    await openPicker();

    await waitFor(() =>
      expect(screen.getByTestId("bloqueados")).toBeEmptyDOMElement(),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "elegir festejo" }),
    );
    await waitFor(() => expect(input).toHaveValue(":festejo:"));
    await userEvent.type(input, "{Enter}");

    expect(onSend).toHaveBeenCalledWith("<a:festejo:e-festejo>", []);
  });
});
