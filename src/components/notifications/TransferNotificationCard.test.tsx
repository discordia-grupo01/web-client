import {
  type MessageAuthor,
  type NotificationHistoryItem,
  type ServerSummary,
} from "@discordia/client-shared";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const acceptTransferRequest = vi.fn();
const rejectTransferRequest = vi.fn();

vi.mock("@/services/ownership-transfers/client", () => ({
  acceptTransferRequest: (...args: unknown[]) => acceptTransferRequest(...args),
  rejectTransferRequest: (...args: unknown[]) => rejectTransferRequest(...args),
}));

import { TransferNotificationCard } from "@/components/notifications/TransferNotificationCard";

const servers = [
  { id: "s1", name: "Grupo 1", icon_url: null, channels: [] },
] as unknown as ServerSummary[];

const author = (id: string, name: string): MessageAuthor => ({
  id,
  name,
  avatarUrl: null,
  roleName: null,
  roleColor: null,
});

const me = author("member", "Beto");
const authors = { owner: author("owner", "Ana"), member: me };

const transfer = (
  overrides: Partial<NotificationHistoryItem> = {},
): NotificationHistoryItem => ({
  kind: "ownership_transfer",
  message_id: "t1",
  author_id: "owner",
  to_user_id: "member",
  transfer_status: "pending",
  occurred_at: "2026-11-02T12:00:00Z",
  server_id: "s1",
  channel_id: null,
  conversation_id: null,
  ...overrides,
});

function renderCard(
  item: NotificationHistoryItem,
  viewer: MessageAuthor | null = me,
  isUnread = true,
) {
  const handlers = { onRead: vi.fn(), onAnswered: vi.fn() };
  render(
    <TransferNotificationCard
      item={item}
      servers={servers}
      authors={authors}
      me={viewer}
      isUnread={isUnread}
      {...handlers}
    />,
  );
  return handlers;
}

describe("TransferNotificationCard", () => {
  beforeEach(() => {
    acceptTransferRequest.mockReset();
    rejectTransferRequest.mockReset();
  });

  it("al receptor le muestra el ofrecimiento con los nombres y los dos botones", () => {
    renderCard(transfer());

    expect(screen.getByText("Transferencia de propiedad")).toBeInTheDocument();
    expect(
      screen.getByText("Ana te ofreció la propiedad de Grupo 1"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Aceptar" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Rechazar" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "No leído" })).toBeInTheDocument();
  });

  it("al dueño le cuenta la respuesta y no le ofrece botones", () => {
    renderCard(transfer({ transfer_status: "accepted" }), authors.owner, false);

    expect(
      screen.getByText("Beto aceptó ser el nuevo dueño de Grupo 1"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Aceptar" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Rechazar" })).toBeNull();
    expect(screen.queryByRole("img", { name: "No leído" })).toBeNull();
  });

  it("un ofrecimiento ya resuelto no se puede volver a responder", () => {
    renderCard(transfer({ transfer_status: "expired" }));

    expect(
      screen.getByText("El ofrecimiento de Grupo 1 venció"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Aceptar" })).toBeNull();
  });

  it("aceptar pide la transferencia, la marca leida y avisa", async () => {
    acceptTransferRequest.mockResolvedValue({ ok: true });
    const { onRead, onAnswered } = renderCard(transfer());

    fireEvent.click(screen.getByRole("button", { name: "Aceptar" }));

    await waitFor(() => expect(onAnswered).toHaveBeenCalledTimes(1));
    expect(acceptTransferRequest).toHaveBeenCalledWith("s1", "t1");
    expect(rejectTransferRequest).not.toHaveBeenCalled();
    expect(onRead).toHaveBeenCalledWith(
      expect.objectContaining({ message_id: "t1" }),
    );
  });

  it("rechazar pide el rechazo y avisa", async () => {
    rejectTransferRequest.mockResolvedValue({ ok: true });
    const { onAnswered } = renderCard(transfer());

    fireEvent.click(screen.getByRole("button", { name: "Rechazar" }));

    await waitFor(() => expect(onAnswered).toHaveBeenCalledTimes(1));
    expect(rejectTransferRequest).toHaveBeenCalledWith("s1", "t1");
  });

  it("si falla muestra el error y no marca nada como respondido", async () => {
    acceptTransferRequest.mockResolvedValue({
      ok: false,
      message: "No pudimos aceptar la transferencia.",
    });
    const { onRead, onAnswered } = renderCard(transfer());

    fireEvent.click(screen.getByRole("button", { name: "Aceptar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No pudimos aceptar la transferencia.",
    );
    expect(onAnswered).not.toHaveBeenCalled();
    expect(onRead).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Aceptar" })).toBeEnabled();
  });

  it("tocar la tarjeta la marca como leida sin responder", () => {
    const { onRead, onAnswered } = renderCard(transfer());

    fireEvent.click(screen.getByText("Transferencia de propiedad"));

    expect(onRead).toHaveBeenCalledTimes(1);
    expect(onAnswered).not.toHaveBeenCalled();
    expect(acceptTransferRequest).not.toHaveBeenCalled();
  });

  it("sin el nombre del servidor ni de las personas no inventa nada", () => {
    render(
      <TransferNotificationCard
        item={transfer({ server_id: "otro" })}
        servers={servers}
        authors={{}}
        me={me}
        isUnread
        onRead={vi.fn()}
        onAnswered={vi.fn()}
      />,
    );

    expect(
      screen.getByText("Alguien te ofreció la propiedad de un servidor"),
    ).toBeInTheDocument();
  });
});
