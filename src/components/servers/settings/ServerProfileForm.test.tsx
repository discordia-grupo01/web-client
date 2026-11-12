import {
  ANIMATED_SERVER_ICON_LOCKED,
  type ServerSummary,
} from "@discordia/client-shared";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useServerSettingsForm } from "@/components/servers/hooks/useServerSettingsForm";

import { ServerProfileForm } from "./ServerProfileForm";

const updateServerRequest = vi.fn();

vi.mock("@/services/servers/client", () => ({
  updateServerRequest: (...args: unknown[]) => updateServerRequest(...args),
}));

beforeEach(() => {
  vi.resetAllMocks();
});

function server(boostLevel: number): ServerSummary {
  return {
    id: "s1",
    name: "Club de Lectura",
    icon_url: null,
    banner_url: null,
    owner_id: "u1",
    created_at: "2026-11-10T00:00:00Z",
    channels: [],
    categories: [],
    boost_count: [3, 5, 15, 30][boostLevel],
    boost_level: boostLevel,
  };
}

function Form({
  summary,
  onBoost,
}: {
  summary: ServerSummary;
  onBoost?: () => void;
}) {
  const form = useServerSettingsForm({ server: summary, onUpdated: vi.fn() });
  return (
    <ServerProfileForm
      form={form}
      serverName={summary.name}
      titleId="title"
      onCancel={vi.fn()}
      onBoost={onBoost}
    />
  );
}

const gif = () => new File(["GIF89a"], "party.gif", { type: "image/gif" });
const iconInput = (container: HTMLElement) =>
  container.querySelectorAll<HTMLInputElement>('input[type="file"]')[0];
const presets = () => screen.getAllByRole("button", { name: /^Fondo / });

describe("ServerProfileForm según el nivel de boosts", () => {
  it("nivel 0: banner y fondos fijos bloqueados hasta el nivel 2", () => {
    render(<Form summary={server(0)} />);

    expect(
      screen.queryByRole("button", { name: "Agregar banner" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Faltan 12 boosts para el nivel 2"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Faltan 2 boosts para el nivel 1"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", {
        name: "Faltan 2 boosts para el nivel 1",
      }),
    ).toHaveAttribute("aria-valuenow", "3");
    for (const preset of presets()) expect(preset).toBeDisabled();
  });

  it("nivel 0: el banner bloqueado ofrece boostear el servidor", async () => {
    const onBoost = vi.fn();
    render(<Form summary={server(0)} onBoost={onBoost} />);

    await userEvent.click(
      screen.getByRole("button", { name: "Boostear servidor" }),
    );

    expect(onBoost).toHaveBeenCalledOnce();
  });

  it("nivel 1: la barra para boostear va con el banner", async () => {
    const onBoost = vi.fn();
    render(<Form summary={server(1)} onBoost={onBoost} />);

    const banner = screen.getByRole("group", { name: "Banner del servidor" });
    expect(within(banner).getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "5",
    );
    await userEvent.click(
      within(banner).getByRole("button", { name: "Boostear servidor" }),
    );
    expect(onBoost).toHaveBeenCalledOnce();
    expect(screen.getAllByRole("progressbar")).toHaveLength(1);
  });

  it("sin a dónde llevar, no muestra el botón de boostear", () => {
    render(<Form summary={server(0)} />);

    expect(
      screen.queryByRole("button", { name: "Boostear servidor" }),
    ).not.toBeInTheDocument();
  });

  it("nivel 0: un ícono GIF pide el nivel 1 y no se agrega", async () => {
    const { container } = render(<Form summary={server(0)} />);

    expect(iconInput(container)).not.toHaveAttribute(
      "accept",
      expect.stringContaining("gif"),
    );
    await userEvent.upload(iconInput(container), gif(), { applyAccept: false });

    expect(screen.getByText(ANIMATED_SERVER_ICON_LOCKED)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Guardar cambios" }),
    ).toBeDisabled();
  });

  it("nivel 1: acepta un ícono GIF; el banner sigue bloqueado", async () => {
    const { container } = render(<Form summary={server(1)} />);

    expect(iconInput(container).accept).toContain("image/gif");
    expect(screen.queryByText("Desbloqueado")).not.toBeInTheDocument();
    expect(screen.getByText("Beneficio del nivel 1")).toBeInTheDocument();
    expect(
      screen.getByText("Faltan 10 boosts para el nivel 2"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", {
        name: "Faltan 10 boosts para el nivel 2",
      }),
    ).toHaveAttribute("aria-valuenow", "5");
    expect(
      screen.getByText("El ícono también puede ser un GIF."),
    ).toBeInTheDocument();
    await userEvent.upload(iconInput(container), gif());

    expect(
      screen.queryByText(ANIMATED_SERVER_ICON_LOCKED),
    ).not.toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Guardar cambios" }),
      ).toBeEnabled(),
    );
    for (const preset of presets()) expect(preset).toBeDisabled();
  });

  it("nivel 2: se puede agregar un banner y elegir un fondo fijo", async () => {
    render(<Form summary={server(2)} />);

    expect(
      screen.getByRole("button", { name: "Agregar banner" }),
    ).toBeInTheDocument();
    const [first] = presets();
    await userEvent.click(first);
    expect(first).toHaveAttribute("aria-pressed", "true");
  });

  it("muestra en el banner el 403 de nivel que devuelve el back", async () => {
    updateServerRequest.mockResolvedValue({
      ok: false,
      message: "Este servidor necesita el nivel 2 de boosts para eso.",
      fieldErrors: {
        banner: "Este servidor necesita el nivel 2 de boosts para eso.",
      },
    });
    render(<Form summary={server(2)} />);

    await userEvent.clear(screen.getByRole("textbox"));
    await userEvent.type(screen.getByRole("textbox"), "Club de Lectura 2");
    await userEvent.click(
      screen.getByRole("button", { name: "Guardar cambios" }),
    );

    expect(
      await screen.findByText(
        "Este servidor necesita el nivel 2 de boosts para eso.",
      ),
    ).toBeInTheDocument();
  });
});
