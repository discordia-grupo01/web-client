import {
  isNotificationUnread,
  NOTIFICATIONS_EMPTY,
  type Message,
  type MessageAuthor,
  type NotificationHistoryItem,
  type ServerSummary,
  UNKNOWN_USER_NAME,
} from "@discordia/client-shared";

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const lookupMessagesRequest = vi.fn();
const getPublicProfileRequest = vi.fn();
const listRolesRequest = vi.fn();

vi.mock("@/services/messages/client", () => ({
  lookupMessagesRequest: (...args: unknown[]) => lookupMessagesRequest(...args),
}));

vi.mock("@/services/profile/client", () => ({
  getPublicProfileRequest: (...args: unknown[]) =>
    getPublicProfileRequest(...args),
}));

vi.mock("@/services/roles/client", () => ({
  listRolesRequest: (...args: unknown[]) => listRolesRequest(...args),
}));

import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import type { NotificationHistoryState } from "@/hooks/useNotificationHistory";
import type { NotificationReadsState } from "@/hooks/useNotificationReads";

const servers = [
  {
    id: "s1",
    name: "Grupo 1",
    icon_url: null,
    channels: [{ id: "c1", name: "general" }],
  },
] as unknown as ServerSummary[];

const me: MessageAuthor = {
  id: "yo",
  name: "Yo",
  avatarUrl: null,
  roleName: null,
  roleColor: null,
};

const mention = (
  messageId: string,
  overrides: Partial<NotificationHistoryItem> = {},
): NotificationHistoryItem => ({
  kind: "mention",
  message_id: messageId,
  author_id: "ana",
  occurred_at: "2026-11-02T12:00:00Z",
  server_id: "s1",
  channel_id: "c1",
  conversation_id: null,
  ...overrides,
});

const direct = (messageId: string): NotificationHistoryItem => ({
  kind: "direct_message",
  message_id: messageId,
  author_id: "beto",
  occurred_at: "2026-11-02T11:00:00Z",
  server_id: null,
  channel_id: null,
  conversation_id: "conv-1",
});

const stored = (id: string, content: string): Message =>
  ({ id, content, channel_id: "c1", user_id: "ana" }) as Message;

function historyState(
  overrides: Partial<NotificationHistoryState> = {},
): NotificationHistoryState {
  return {
    items: [],
    status: "ready",
    error: null,
    hasMore: false,
    isLoadingMore: false,
    loadMoreError: null,
    loadMore: vi.fn(),
    reload: vi.fn(),
    refresh: vi.fn(),
    ...overrides,
  };
}

function readsState(
  overrides: Partial<NotificationReadsState> = {},
): NotificationReadsState {
  const marks = overrides.marks ?? {};
  return {
    marks,
    isUnread: (item) => isNotificationUnread(item, marks),
    unreadCount: 1,
    markChannelRead: vi.fn(),
    markConversationRead: vi.fn(),
    markTransferRead: vi.fn(),
    markAllRead: vi.fn(),
    ...overrides,
  };
}

function unreadState(hasUnread = false, serverResult = true) {
  return {
    hasUnread,
    markAllRead: vi.fn(() => Promise.resolve(serverResult)),
  };
}

async function renderCenter(
  history: NotificationHistoryState,
  reads: NotificationReadsState = readsState(),
  unread = unreadState(),
) {
  const handlers = {
    onClose: vi.fn(),
    onOpenMention: vi.fn(),
    onOpenDirectMessage: vi.fn(),
    onTransferAnswered: vi.fn(),
  };
  const anchorRef = createRef<HTMLElement>();
  let view!: ReturnType<typeof render>;
  await act(async () => {
    view = render(
      <NotificationCenter
        history={history}
        reads={reads}
        unread={unread}
        directMessages={unreadState()}
        mentions={unreadState()}
        servers={servers}
        me={me}
        anchorRef={anchorRef}
        {...handlers}
      />,
    );
  });
  return { ...handlers, view, anchorRef };
}

describe("NotificationCenter", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-04T00:00:00Z"));
    vi.clearAllMocks();
    lookupMessagesRequest.mockResolvedValue({ ok: true, messages: [] });
    listRolesRequest.mockResolvedValue({ ok: true, roles: [] });
    getPublicProfileRequest.mockImplementation((id: string) =>
      Promise.resolve({
        ok: true,
        user: { id, name: id === "ana" ? "Ana" : "Beto", avatar_url: "" },
      }),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("agrupa las menciones por canal con el servidor y la cantidad", async () => {
    await renderCenter(historyState({ items: [mention("m3"), mention("m2")] }));

    expect(screen.getByText("general")).toBeInTheDocument();
    expect(screen.getByText("Grupo 1")).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "2 sin leer" })).toBeVisible();
    expect(await screen.findAllByText("Ana")).toHaveLength(2);
  });

  it("muestra el texto del mensaje de cada notificacion", async () => {
    lookupMessagesRequest.mockResolvedValue({
      ok: true,
      messages: [
        stored("m2", "hola <@yo> mirá esto"),
        stored("m1", "otro mensaje"),
      ],
    });

    await renderCenter(historyState({ items: [mention("m2"), mention("m1")] }));

    expect(await screen.findByText("hola @Yo mirá esto")).toBeInTheDocument();
    expect(screen.getByText("otro mensaje")).toBeInTheDocument();
    expect(lookupMessagesRequest).toHaveBeenCalledWith(["m2", "m1"]);
  });

  it("muestra el nombre del rol mencionado, pidiendo los roles una vez por servidor", async () => {
    const roleId = "0b9d4f2e-3c1a-4e8b-9f6d-2a7c5e1b3d40";
    lookupMessagesRequest.mockResolvedValue({
      ok: true,
      messages: [
        stored("m2", `<@&${roleId}> cómo están?`),
        stored("m1", `otra vez <@&${roleId}>`),
      ],
    });
    listRolesRequest.mockResolvedValue({
      ok: true,
      roles: [{ id: roleId, name: "Moderadores" }],
    });

    await renderCenter(historyState({ items: [mention("m2"), mention("m1")] }));

    expect(
      await screen.findByText("@Moderadores cómo están?"),
    ).toBeInTheDocument();
    expect(listRolesRequest).toHaveBeenCalledTimes(1);
    expect(listRolesRequest).toHaveBeenCalledWith("s1");
  });

  it("mientras no llega el texto, o si el mensaje ya no esta, dice que paso", async () => {
    lookupMessagesRequest.mockResolvedValue({
      ok: true,
      messages: [stored("m2", "este si llega")],
    });

    await renderCenter(historyState({ items: [mention("m2"), mention("m1")] }));

    expect(await screen.findByText("este si llega")).toBeInTheDocument();
    expect(screen.getAllByText("te mencionó")).toHaveLength(1);
  });

  it("si falla traer el texto igual se ve la lista", async () => {
    lookupMessagesRequest.mockResolvedValue({ ok: false, message: "x" });

    await renderCenter(historyState({ items: [mention("m2")] }));

    expect(await screen.findByText("te mencionó")).toBeInTheDocument();
    expect(screen.getByText("general")).toBeInTheDocument();
  });

  it("un mensaje directo muestra a quien lo envio como titulo de su grupo", async () => {
    await renderCenter(historyState({ items: [direct("m1")] }));

    expect(screen.getByText("Mensaje directo")).toBeInTheDocument();
    expect(await screen.findAllByText("Beto")).not.toHaveLength(0);
    expect(screen.getByText("te envió un mensaje")).toBeInTheDocument();
  });

  it("mientras no llega el perfil usa un nombre generico", async () => {
    getPublicProfileRequest.mockResolvedValue({ ok: false, message: "x" });

    await renderCenter(historyState({ items: [direct("m1")] }));

    expect(
      (await screen.findAllByText(UNKNOWN_USER_NAME)).length,
    ).toBeGreaterThan(0);
  });

  it("las pestañas filtran por tipo", async () => {
    await renderCenter(historyState({ items: [mention("m2"), direct("m1")] }));
    expect(screen.getByText("general")).toBeInTheDocument();
    expect(screen.getByText("Mensaje directo")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Menciones" }));
    expect(screen.getByText("general")).toBeInTheDocument();
    expect(screen.queryByText("Mensaje directo")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Directos" }));
    expect(screen.queryByText("general")).not.toBeInTheDocument();
    expect(screen.getByText("Mensaje directo")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Todas" }));
    expect(screen.getByText("general")).toBeInTheDocument();
  });

  it("una pestaña sin nada lo dice con su propio texto", async () => {
    await renderCenter(historyState({ items: [mention("m2")] }));

    fireEvent.click(screen.getByRole("tab", { name: "Directos" }));

    expect(screen.getByText("No tenés mensajes directos.")).toBeInTheDocument();
  });

  it("sin notificaciones lo dice, en no leidos y en todas", async () => {
    await renderCenter(historyState(), readsState({ unreadCount: 0 }));

    expect(
      screen.getByText("No tenés notificaciones sin leer."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Todas" }));

    expect(screen.getByText(NOTIFICATIONS_EMPTY)).toBeInTheDocument();
  });

  it("mientras carga muestra el indicador", async () => {
    await renderCenter(historyState({ status: "loading" }));

    expect(screen.getByRole("status")).toHaveTextContent("Cargando…");
  });

  it("si no se pudo cargar muestra el error y reintentar vuelve a pedir", async () => {
    const history = historyState({
      status: "error",
      error: "No pudimos cargar",
    });
    await renderCenter(history);

    expect(screen.getByRole("alert")).toHaveTextContent("No pudimos cargar");
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(history.reload).toHaveBeenCalledTimes(1);
  });

  it("abrir una mencion va al canal y cierra el panel", async () => {
    const handlers = await renderCenter(
      historyState({ items: [mention("m2")] }),
    );

    fireEvent.click(screen.getByText("te mencionó"));

    expect(handlers.onOpenMention).toHaveBeenCalledWith("s1", "c1");
    expect(handlers.onClose).toHaveBeenCalledTimes(1);
  });

  it("tocar el encabezado de un canal abre ese canal", async () => {
    const handlers = await renderCenter(
      historyState({ items: [mention("m3"), mention("m2")] }),
    );

    fireEvent.click(screen.getByText("general"));

    expect(handlers.onOpenMention).toHaveBeenCalledWith("s1", "c1");
    expect(handlers.onClose).toHaveBeenCalledTimes(1);
  });

  it("abrir un mensaje directo abre esa conversacion con quien lo envio", async () => {
    const handlers = await renderCenter(
      historyState({ items: [direct("m1")] }),
    );

    await screen.findAllByText("Beto");
    fireEvent.click(screen.getByText("te envió un mensaje"));

    expect(handlers.onOpenDirectMessage).toHaveBeenCalledWith(
      expect.objectContaining({ id: "beto", name: "Beto" }),
    );
    expect(handlers.onClose).toHaveBeenCalledTimes(1);
  });

  it("abrir un mensaje directo sin perfil todavia usa el id del autor", async () => {
    getPublicProfileRequest.mockReturnValue(new Promise(() => undefined));
    const handlers = await renderCenter(
      historyState({ items: [direct("m1")] }),
    );

    fireEvent.click(screen.getByText("te envió un mensaje"));

    expect(handlers.onOpenDirectMessage).toHaveBeenCalledWith("beto");
  });

  it("muestra las tres ultimas de un grupo y deja expandir el resto", async () => {
    await renderCenter(
      historyState({
        items: ["m5", "m4", "m3", "m2", "m1"].map((id) => mention(id)),
      }),
    );

    expect(screen.getAllByText("te mencionó")).toHaveLength(3);

    fireEvent.click(screen.getByRole("button", { name: "Ver 2 más" }));
    expect(screen.getAllByText("te mencionó")).toHaveLength(5);

    fireEvent.click(screen.getByRole("button", { name: "Ver menos" }));
    expect(screen.getAllByText("te mencionó")).toHaveLength(3);
  });

  it("ver anteriores pide la pagina siguiente solo si hay otra", async () => {
    const history = historyState({ items: [mention("m2")], hasMore: true });
    await renderCenter(history);

    fireEvent.click(screen.getByRole("button", { name: "Ver anteriores" }));

    expect(history.loadMore).toHaveBeenCalledTimes(1);
  });

  it("sin otra pagina no hay boton de ver anteriores", async () => {
    await renderCenter(historyState({ items: [mention("m2")] }));

    expect(
      screen.queryByRole("button", { name: "Ver anteriores" }),
    ).not.toBeInTheDocument();
  });

  it("una pestaña vacia con mas paginas no dice que no hay nada", async () => {
    await renderCenter(historyState({ items: [mention("m2")], hasMore: true }));

    fireEvent.click(screen.getByRole("tab", { name: "Directos" }));

    expect(
      screen.queryByText("No tenés mensajes directos."),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Ver anteriores" }),
    ).toBeInTheDocument();
  });

  it("muestra el error de una pagina siguiente sin perder lo cargado", async () => {
    await renderCenter(
      historyState({
        items: [mention("m2")],
        hasMore: true,
        loadMoreError: "Fallo la pagina",
      }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Fallo la pagina");
    expect(screen.getByText("general")).toBeInTheDocument();
  });

  it("las notificaciones nuevas aparecen sin reabrir el panel", async () => {
    const { view, onClose, onOpenMention, onOpenDirectMessage, anchorRef } =
      await renderCenter(historyState({ items: [mention("m1")] }));

    expect(screen.getAllByText("te mencionó")).toHaveLength(1);

    await act(async () => {
      view.rerender(
        <NotificationCenter
          history={historyState({ items: [mention("m2"), mention("m1")] })}
          reads={readsState()}
          unread={unreadState()}
          directMessages={unreadState()}
          mentions={unreadState()}
          servers={servers}
          me={me}
          anchorRef={anchorRef}
          onClose={onClose}
          onOpenMention={onOpenMention}
          onOpenDirectMessage={onOpenDirectMessage}
          onTransferAnswered={vi.fn()}
        />,
      );
    });

    await waitFor(() =>
      expect(screen.getAllByText("te mencionó")).toHaveLength(2),
    );
  });

  it("el boton de cerrar y Escape cierran el panel", async () => {
    const handlers = await renderCenter(historyState());

    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    fireEvent.keyDown(document, { key: "Escape" });

    expect(handlers.onClose).toHaveBeenCalledTimes(2);
  });
  describe("leidas y no leidas", () => {
    it("abre en la pestaña de no leidos y esconde lo que ya se leyo", async () => {
      await renderCenter(
        historyState({ items: [mention("m2"), direct("m1")] }),
        readsState({ marks: { "dm:conv-1": "2026-11-03T00:00:00Z" } }),
      );

      expect(screen.getByRole("tab", { name: "No leídos" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      expect(screen.getByText("general")).toBeInTheDocument();
      expect(screen.queryByText("Mensaje directo")).not.toBeInTheDocument();
    });

    it("lo leido sigue disponible en la pestaña de todas", async () => {
      await renderCenter(
        historyState({ items: [mention("m2"), direct("m1")] }),
        readsState({ marks: { "dm:conv-1": "2026-11-03T00:00:00Z" } }),
      );

      fireEvent.click(screen.getByRole("tab", { name: "Todas" }));

      expect(screen.getByText("Mensaje directo")).toBeInTheDocument();
      expect(screen.getByText("general")).toBeInTheDocument();
    });

    it("si todo esta leido, no leidos lo dice", async () => {
      await renderCenter(
        historyState({ items: [mention("m2")] }),
        readsState({
          marks: { "channel:c1": "2026-11-03T00:00:00Z" },
          unreadCount: 0,
        }),
      );

      expect(
        screen.getByText("No tenés notificaciones sin leer."),
      ).toBeInTheDocument();
      expect(screen.queryByText("general")).not.toBeInTheDocument();
    });

    it("marca con un punto lo no leido y no lo leido en las demas pestañas", async () => {
      await renderCenter(
        historyState({
          items: [
            mention("m2", { occurred_at: "2026-11-02T12:00:02Z" }),
            mention("m1", { occurred_at: "2026-11-02T12:00:01Z" }),
          ],
        }),
        readsState({ marks: { "channel:c1": "2026-11-02T12:00:01Z" } }),
      );

      fireEvent.click(screen.getByRole("tab", { name: "Todas" }));

      expect(screen.getAllByRole("img", { name: "No leído" })).toHaveLength(1);
      expect(screen.getAllByText("te mencionó")).toHaveLength(2);
    });

    it("el contador de un grupo cuenta solo lo no leido y desaparece si no queda nada", async () => {
      await renderCenter(
        historyState({
          items: [
            mention("m2", { occurred_at: "2026-11-02T12:00:02Z" }),
            mention("m1", { occurred_at: "2026-11-02T12:00:01Z" }),
          ],
        }),
        readsState({ marks: { "channel:c1": "2026-11-02T12:00:01Z" } }),
      );

      fireEvent.click(screen.getByRole("tab", { name: "Todas" }));
      expect(screen.getByRole("status", { name: "1 sin leer" })).toBeVisible();
    });

    it("sin nada sin leer no hay contador en el grupo", async () => {
      await renderCenter(
        historyState({ items: [mention("m2")] }),
        readsState({
          marks: { "channel:c1": "2026-11-03T00:00:00Z" },
          unreadCount: 0,
        }),
      );

      fireEvent.click(screen.getByRole("tab", { name: "Todas" }));

      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("en no leidos no ofrece ver mas si lo ultimo cargado ya esta leido", async () => {
      await renderCenter(
        historyState({ items: [mention("m2")], hasMore: true }),
        readsState({
          marks: { "channel:c1": "2026-11-03T00:00:00Z" },
          unreadCount: 0,
        }),
      );

      expect(
        screen.queryByRole("button", { name: "Ver anteriores" }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByText("No tenés notificaciones sin leer."),
      ).toBeInTheDocument();
    });

    it("en no leidos ofrece ver mas si lo ultimo cargado sigue sin leer", async () => {
      await renderCenter(
        historyState({ items: [mention("m2")], hasMore: true }),
      );

      expect(
        screen.getByRole("button", { name: "Ver anteriores" }),
      ).toBeInTheDocument();
    });

    it("en todas siempre ofrece ver mas si hay otra pagina", async () => {
      await renderCenter(
        historyState({ items: [mention("m2")], hasMore: true }),
        readsState({
          marks: { "channel:c1": "2026-11-03T00:00:00Z" },
          unreadCount: 0,
        }),
      );

      fireEvent.click(screen.getByRole("tab", { name: "Todas" }));

      expect(
        screen.getByRole("button", { name: "Ver anteriores" }),
      ).toBeInTheDocument();
    });

    it("marcar todo como leido marca el historial y los canales", async () => {
      const reads = readsState();
      const unread = unreadState(true);
      await renderCenter(
        historyState({ items: [mention("m2")] }),
        reads,
        unread,
      );

      await act(async () => {
        fireEvent.click(
          screen.getByRole("button", { name: "Marcar todo como leído" }),
        );
      });

      expect(reads.markAllRead).toHaveBeenCalledTimes(1);
      expect(unread.markAllRead).toHaveBeenCalledTimes(1);
    });

    it("con todo leido el boton de marcar todo esta deshabilitado", async () => {
      await renderCenter(
        historyState({ items: [mention("m2")] }),
        readsState({ unreadCount: 0 }),
      );

      expect(
        screen.getByRole("button", { name: "Marcar todo como leído" }),
      ).toBeDisabled();
    });

    it("con canales sin leer se puede marcar aunque el centro este leido", async () => {
      await renderCenter(
        historyState({ items: [mention("m2")] }),
        readsState({ unreadCount: 0 }),
        unreadState(true),
      );

      expect(
        screen.getByRole("button", { name: "Marcar todo como leído" }),
      ).toBeEnabled();
    });

    it("si falla marcar los canales muestra el error", async () => {
      await renderCenter(
        historyState({ items: [mention("m2")] }),
        readsState(),
        unreadState(true, false),
      );

      await act(async () => {
        fireEvent.click(
          screen.getByRole("button", { name: "Marcar todo como leído" }),
        );
      });

      expect(screen.getByRole("alert")).toHaveTextContent(
        "No pudimos marcar todo como leído. Probá de nuevo.",
      );
    });
  });
  describe("orden cronologico", () => {
    const at = (second: number) => `2026-11-02T12:00:0${second}Z`;

    it("dentro de un grupo lo mas viejo va arriba y lo mas nuevo abajo", async () => {
      lookupMessagesRequest.mockResolvedValue({
        ok: true,
        messages: [
          stored("m1", "uno"),
          stored("m2", "dos"),
          stored("m3", "tres"),
        ],
      });

      await renderCenter(
        historyState({
          items: [
            mention("m3", { occurred_at: at(3) }),
            mention("m2", { occurred_at: at(2) }),
            mention("m1", { occurred_at: at(1) }),
          ],
        }),
      );

      const texts = await screen.findAllByText(/^(uno|dos|tres)$/);

      expect(texts.map((node) => node.textContent)).toEqual([
        "uno",
        "dos",
        "tres",
      ]);
    });

    it("los grupos van de lo que empezo antes a lo que empezo despues", async () => {
      await renderCenter(
        historyState({
          items: [
            direct("m3"),
            mention("m2", { occurred_at: at(2) }),
            mention("m1", { occurred_at: at(1) }),
          ].map((entry) =>
            entry.kind === "direct_message"
              ? { ...entry, occurred_at: at(3) }
              : entry,
          ),
        }),
      );

      const channel = screen.getByText("general");
      const directGroup = screen.getByText("Mensaje directo");

      expect(
        channel.compareDocumentPosition(directGroup) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });

    it("el boton de cargar anteriores esta arriba de las notificaciones", async () => {
      await renderCenter(
        historyState({ items: [mention("m2")], hasMore: true }),
      );

      const button = screen.getByRole("button", { name: "Ver anteriores" });
      const group = screen.getByText("general");

      expect(
        button.compareDocumentPosition(group) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });
  });
  describe("lo leido caduca a los 7 dias", () => {
    const day = 24 * 60 * 60 * 1000;
    const ago = (days: number) =>
      new Date(Date.now() - days * day).toISOString();
    const readAll = () => false;

    it("lo leido de hace mas de 7 dias ya no aparece en todas", async () => {
      await renderCenter(
        historyState({
          items: [
            mention("nuevo", { occurred_at: ago(1) }),
            mention("viejo", { occurred_at: ago(8), channel_id: "c1" }),
          ],
        }),
        readsState({ isUnread: readAll, unreadCount: 0 }),
      );

      fireEvent.click(screen.getByRole("tab", { name: "Todas" }));

      expect(screen.getAllByText("te mencionó")).toHaveLength(1);
    });

    it("lo no leido se sigue viendo aunque tenga mas de 7 dias", async () => {
      await renderCenter(
        historyState({ items: [mention("viejo", { occurred_at: ago(30) })] }),
      );

      fireEvent.click(screen.getByRole("tab", { name: "Todas" }));

      expect(screen.getByText("te mencionó")).toBeInTheDocument();
    });

    it("no ofrece cargar anteriores si lo ultimo cargado ya caduco", async () => {
      await renderCenter(
        historyState({
          items: [mention("viejo", { occurred_at: ago(9) })],
          hasMore: true,
        }),
        readsState({ isUnread: readAll, unreadCount: 0 }),
      );

      fireEvent.click(screen.getByRole("tab", { name: "Todas" }));

      expect(
        screen.queryByRole("button", { name: "Ver anteriores" }),
      ).not.toBeInTheDocument();
      expect(screen.getByText(NOTIFICATIONS_EMPTY)).toBeInTheDocument();
    });

    it("si lo ultimo cargado todavia no caduco sigue ofreciendo anteriores", async () => {
      await renderCenter(
        historyState({
          items: [mention("reciente", { occurred_at: ago(2) })],
          hasMore: true,
        }),
        readsState({ isUnread: readAll, unreadCount: 0 }),
      );

      fireEvent.click(screen.getByRole("tab", { name: "Todas" }));

      expect(
        screen.getByRole("button", { name: "Ver anteriores" }),
      ).toBeInTheDocument();
    });

    it("usa lo que ya sabe messaging para no mostrar como no leido lo leido", async () => {
      await renderCenter(
        historyState({ items: [mention("m2"), direct("m1")] }),
        readsState({ isUnread: (item) => item.kind === "direct_message" }),
      );

      expect(screen.getByText("Mensaje directo")).toBeInTheDocument();
      expect(screen.queryByText("general")).not.toBeInTheDocument();
    });
  });

  describe("tamaño y responsive", () => {
    it("el panel tiene un alto fijo para no cambiar de tamaño segun la pestaña", async () => {
      await renderCenter(historyState({ items: [mention("m2")] }));
      const dialog = screen.getByRole("dialog");
      const before = dialog.className;

      fireEvent.click(screen.getByRole("tab", { name: "Directos" }));
      fireEvent.click(screen.getByRole("tab", { name: "Todas" }));

      expect(dialog.className).toBe(before);
      expect(dialog.className).toContain("h-[min(640px,calc(100dvh-16px))]");
    });

    it("en pantallas chicas ocupa casi toda la pantalla", async () => {
      await renderCenter(historyState());

      expect(screen.getByRole("dialog").className).toContain("max-sm:!inset-2");
    });

    it("las pestañas no se cortan: hacen scroll horizontal si no entran", async () => {
      await renderCenter(historyState());

      expect(screen.getByRole("tablist").className).toContain(
        "overflow-x-auto",
      );
    });
  });
});
