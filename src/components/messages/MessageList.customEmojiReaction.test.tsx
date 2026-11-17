import type {
  CustomEmoji,
  Message,
  MessageAuthor,
  ServerEmoji,
} from "@discordia/client-shared";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("./MessageEditor", () => import("./MessageEditor.fake"));

vi.mock("@/utils/settingsRequest", () => ({
  openSettingsSection: vi.fn(),
}));

vi.mock("@/services/attachments/client", () => ({
  uploadAttachmentRequest: vi.fn(),
}));

vi.mock("@/services/emojis/client", () => ({
  listServerEmojisRequest: (...args: unknown[]) =>
    listServerEmojisRequest(...args),
}));

vi.mock("@/services/custom-emojis/client", () => ({
  listCustomEmojisRequest: (...args: unknown[]) =>
    listCustomEmojisRequest(...args),
}));

/**
 * El selector real es emoji-mart, que vive en un shadow DOM y se carga aparte.
 * Acá se reemplaza por los botones que llamarían a lo mismo que llama él.
 */
vi.mock("./EmojiPicker", () => ({
  EmojiPicker: ({
    onPickCustom,
    onOpenChange,
  }: {
    onPickCustom?: (id: string) => void;
    onOpenChange?: (isOpen: boolean) => void;
  }) => (
    <>
      <button type="button" onClick={() => onOpenChange?.(true)}>
        abrir selector
      </button>
      <button type="button" onClick={() => onPickCustom?.(MATE)}>
        elegir mate
      </button>
      <button type="button" onClick={() => onPickCustom?.(FESTEJO)}>
        elegir festejo
      </button>
    </>
  ),
}));

import { ChatPremiumOfferProvider } from "@/contexts/ChatPremiumOfferContext";
import { CustomEmojisProvider } from "@/contexts/CustomEmojisContext";
import { OwnProfileProvider } from "@/contexts/OwnProfileContext";
import { ServerEmojisProvider } from "@/contexts/ServerEmojisContext";

import { MessageComposer } from "./MessageComposer";
import { MessageList } from "./MessageList";

const listServerEmojisRequest = vi.fn();
const listCustomEmojisRequest = vi.fn();

// El token de una reacción se lee con una expresión que pide UUID en el id.
const MATE = "11111111-1111-4111-8111-111111111111";
const FESTEJO = "22222222-2222-4222-8222-222222222222";
const MATE_TOKEN = `<:mate:${MATE}>`;
const FESTEJO_TOKEN = `<a:festejo:${FESTEJO}>`;

const ANA: MessageAuthor = {
  id: "u1",
  name: "Ana",
  avatarUrl: null,
  roleName: null,
  roleColor: null,
};

const serverEmoji = (
  id: string,
  name: string,
  animated: boolean,
): ServerEmoji => ({
  id,
  server_id: "s1",
  name,
  animated,
  image_url: `https://cdn.test/${name}.png`,
  created_by: "u1",
  created_at: "2026-11-03T12:00:00Z",
});

const customEmoji = (id: string, name: string, animated: boolean) =>
  ({
    id,
    server_id: "s1",
    name,
    animated,
    image_url: `https://cdn.test/${name}.png`,
    deleted: false,
  }) satisfies CustomEmoji;

function message(reactions: Message["reactions"] = []): Message {
  return {
    id: "m1",
    channel_id: "ch1",
    server_id: "s1",
    user_id: "u1",
    content: "hola",
    inserted_at: "2026-11-03T15:00:00Z",
    edited_at: null,
    reactions,
  } as Message;
}

function renderList(
  premium: boolean,
  { reactions = [] as Message["reactions"], serverId = "s1" as string | null } = {},
) {
  listServerEmojisRequest.mockResolvedValue({
    ok: true,
    page: {
      emojis: [
        serverEmoji(MATE, "mate", false),
        serverEmoji(FESTEJO, "festejo", true),
      ],
      max_emojis: 50,
    },
  });
  listCustomEmojisRequest.mockResolvedValue({
    ok: true,
    emojis: [
      customEmoji(MATE, "mate", false),
      customEmoji(FESTEJO, "festejo", true),
    ],
  });
  const onToggleReaction = vi.fn();

  render(
    <OwnProfileProvider
      value={{
        profile: { id: "u1", name: "Juana", premium } as never,
        refresh: vi.fn(),
      }}
    >
      <CustomEmojisProvider>
        <ServerEmojisProvider
          servers={[{ id: "s1", name: "Física", icon_url: null }]}
        >
          <ChatPremiumOfferProvider>
            <MessageList
              welcome={null}
              label="Mensajes de #general"
              messages={[message(reactions)]}
              authors={{ u1: ANA }}
              currentUserId="u1"
              canManageMessages={false}
              canSendMessages
              serverId={serverId}
              onToggleReaction={onToggleReaction}
              onEditMessage={vi.fn()}
              onDeleteMessage={vi.fn()}
            />
            {/* La oferta se dibuja debajo del compositor, no en el mensaje. */}
            <MessageComposer
              placeholder="Mensaje en #general"
              onSend={vi.fn()}
              uploadTarget={{ channelId: "c1" }}
              server={
                serverId === null
                  ? undefined
                  : { id: serverId, name: "Física", icon_url: null }
              }
            />
          </ChatPremiumOfferProvider>
        </ServerEmojisProvider>
      </CustomEmojisProvider>
    </OwnProfileProvider>,
  );

  return { onToggleReaction };
}

async function openPicker() {
  await userEvent.click(
    screen.getAllByRole("button", { name: "abrir selector" })[0],
  );
  await waitFor(() =>
    expect(listServerEmojisRequest).toHaveBeenCalledWith("s1"),
  );
}

const OFFER_TITLE = "Sumarte a esta reacción es de Premium";

describe("reaccionar con un emoji del servidor", () => {
  it("manda el token del emoji elegido", async () => {
    const { onToggleReaction } = renderList(false);
    await openPicker();

    await userEvent.click(
      screen.getAllByRole("button", { name: "elegir mate" })[0],
    );

    expect(onToggleReaction).toHaveBeenCalledWith("m1", MATE_TOKEN);
  });

  it("sin Premium, el animado no se manda y aparece la oferta", async () => {
    const { onToggleReaction } = renderList(false);
    await openPicker();

    await userEvent.click(
      screen.getAllByRole("button", { name: "elegir festejo" })[0],
    );

    expect(onToggleReaction).not.toHaveBeenCalled();
    expect(screen.getByText(OFFER_TITLE)).toBeInTheDocument();
  });

  it("con Premium, el animado se manda con la marca `a`", async () => {
    const { onToggleReaction } = renderList(true);
    await openPicker();

    await userEvent.click(
      screen.getAllByRole("button", { name: "elegir festejo" })[0],
    );

    expect(onToggleReaction).toHaveBeenCalledWith("m1", FESTEJO_TOKEN);
    expect(screen.queryByText(OFFER_TITLE)).not.toBeInTheDocument();
  });

  it("en un mensaje directo hasta el que no es GIF pide Premium", async () => {
    const { onToggleReaction } = renderList(false, { serverId: null });
    await openPicker();

    await userEvent.click(
      screen.getAllByRole("button", { name: "elegir mate" })[0],
    );

    expect(onToggleReaction).not.toHaveBeenCalled();
    expect(screen.getByText(OFFER_TITLE)).toBeInTheDocument();
  });
});

describe("sumarse a una reacción que ya existe", () => {
  const animatedReaction = [
    { emoji: FESTEJO_TOKEN, count: 2, reacted_by_me: false },
  ];

  it("sin Premium ofrece Premium en vez de sumarse", async () => {
    const { onToggleReaction } = renderList(false, {
      reactions: animatedReaction,
    });

    const chip = await screen.findByRole("button", {
      name: /:festejo: 2 · Sumarte es de Premium/,
    });
    await userEvent.click(chip);

    expect(onToggleReaction).not.toHaveBeenCalled();
    expect(screen.getByText(OFFER_TITLE)).toBeInTheDocument();
  });

  it("sacar la propia siempre se puede", async () => {
    const { onToggleReaction } = renderList(false, {
      reactions: [{ emoji: FESTEJO_TOKEN, count: 2, reacted_by_me: true }],
    });

    await userEvent.click(
      await screen.findByRole("button", { name: /:festejo: 2/ }),
    );

    expect(onToggleReaction).toHaveBeenCalledWith("m1", FESTEJO_TOKEN);
    expect(screen.queryByText(OFFER_TITLE)).not.toBeInTheDocument();
  });

  it("con Premium se suma como cualquier otra", async () => {
    const { onToggleReaction } = renderList(true, {
      reactions: animatedReaction,
    });

    await userEvent.click(
      await screen.findByRole("button", { name: /:festejo: 2/ }),
    );

    expect(onToggleReaction).toHaveBeenCalledWith("m1", FESTEJO_TOKEN);
  });
});
