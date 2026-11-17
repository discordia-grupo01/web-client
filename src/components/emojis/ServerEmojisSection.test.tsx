import type { ServerEmoji, ServerSummary } from "@discordia/client-shared";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ServerEmojisSection } from "./ServerEmojisSection";

const listServerEmojisRequest = vi.fn();
const deleteServerEmojiRequest = vi.fn();
const listMembersRequest = vi.fn();

vi.mock("@/services/emojis/client", () => ({
  listServerEmojisRequest: (...args: unknown[]) =>
    listServerEmojisRequest(...args),
  deleteServerEmojiRequest: (...args: unknown[]) =>
    deleteServerEmojiRequest(...args),
  uploadServerEmojiRequest: vi.fn(),
}));

vi.mock("@/services/members/client", () => ({
  listMembersRequest: (...args: unknown[]) => listMembersRequest(...args),
}));

const server: ServerSummary = {
  id: "s1",
  name: "Club de lectura",
  icon_url: null,
  banner_url: null,
  owner_id: "u1",
  created_at: "2026-10-01T12:00:00Z",
  channels: [],
  categories: [],
  boost_count: 7,
  boost_level: 1,
};

const emoji = (name: string, animated = false): ServerEmoji => ({
  id: `e-${name}`,
  server_id: "s1",
  name,
  animated,
  image_url: `https://cdn.test/${name}.png`,
  created_by: "u1",
  created_at: "2026-11-03T12:00:00Z",
});

function renderSection({ canManageServer = true } = {}) {
  render(
    <ServerEmojisSection
      server={server}
      canManageServer={canManageServer}
      titleId="title"
    />,
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  listServerEmojisRequest.mockResolvedValue({
    ok: true,
    page: { emojis: [emoji("festejo"), emoji("mate", true)], max_emojis: 70 },
  });
  listMembersRequest.mockResolvedValue({
    ok: true,
    members: [
      {
        user_id: "u1",
        is_owner: true,
        joined_at: "",
        profile: { name: "Ana", avatar_url: "", description: "" },
      },
    ],
    total: 1,
  });
});

describe("ServerEmojisSection", () => {
  it("CA1: lista los emojis con los lugares usados y marca los animados", async () => {
    renderSection();

    expect(await screen.findByText(":festejo:")).toBeInTheDocument();
    expect(screen.getByText(":mate:")).toBeInTheDocument();
    expect(screen.getByText("/ 70 lugares disponibles")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "2",
    );
    expect(screen.getByText("GIF")).toBeInTheDocument();
    expect(listServerEmojisRequest).toHaveBeenCalledWith("s1");
  });

  it("sin Premium, los animados llevan la insignia en vez de un candado", async () => {
    renderSection();
    await screen.findByText(":mate:");

    // Sin OwnProfileProvider la persona no tiene Premium; solo el GIF la lleva.
    expect(screen.getAllByTitle("Para usarlo necesitás Premium")).toHaveLength(
      1,
    );
  });

  it("nombra a quien lo subió cruzando con los miembros", async () => {
    renderSection();

    // Los dos emojis los subió la misma persona el mismo día.
    expect(await screen.findAllByText("Subido por Ana · 3 nov")).toHaveLength(
      2,
    );
  });

  it("CA3: borrar pide confirmación y saca el emoji de la lista", async () => {
    deleteServerEmojiRequest.mockResolvedValue({ ok: true });
    renderSection();
    await screen.findByText(":festejo:");

    await userEvent.click(
      screen.getByRole("button", { name: "Eliminar emoji :festejo:" }),
    );
    expect(screen.getByText("¿Eliminar :festejo:?")).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Eliminar emoji" }),
    );

    expect(deleteServerEmojiRequest).toHaveBeenCalledWith("s1", "e-festejo");
    expect(await screen.findByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "1",
    );
    expect(screen.queryByText(":festejo:")).not.toBeInTheDocument();
  });

  it("CA4: un miembro sin permiso ve la lista sin botones", async () => {
    renderSection({ canManageServer: false });

    expect(await screen.findByText(":festejo:")).toBeInTheDocument();
    expect(
      screen.getByText(/Solo quienes gestionan el servidor/),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Subir emoji" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Eliminar emoji :/ }),
    ).not.toBeInTheDocument();
  });

  it("CA2: sin lugares no deja subir y lo avisa", async () => {
    listServerEmojisRequest.mockResolvedValue({
      ok: true,
      page: { emojis: [emoji("festejo"), emoji("mate")], max_emojis: 2 },
    });
    renderSection();

    expect(
      await screen.findByText("/ 2 lugares disponibles"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Subir emoji" })).toBeDisabled();
    expect(screen.getByText(/No quedan lugares para emojis/)).toBeVisible();
  });

  it("si no puede cargar la lista, lo dice y no muestra los lugares", async () => {
    listServerEmojisRequest.mockResolvedValue({
      ok: false,
      message: "No pudimos cargar los emojis del servidor. Intentá de nuevo.",
    });
    renderSection();

    expect(
      await screen.findByText(/No pudimos cargar los emojis/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/lugares disponibles/)).not.toBeInTheDocument();
  });
});
