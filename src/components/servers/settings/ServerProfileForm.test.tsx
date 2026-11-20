import {
  ANIMATED_SERVER_ICON_COPY,
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
  onShowBenefits,
}: {
  summary: ServerSummary;
  onBoost?: () => void;
  onShowBenefits?: () => void;
}) {
  const form = useServerSettingsForm({ server: summary, onUpdated: vi.fn() });
  return (
    <ServerProfileForm
      form={form}
      serverName={summary.name}
      onBoost={onBoost}
      onShowBenefits={onShowBenefits}
    />
  );
}

const gif = () => new File(["GIF89a"], "party.gif", { type: "image/gif" });
const iconInput = (container: HTMLElement) =>
  container.querySelectorAll<HTMLInputElement>('input[type="file"]')[0];
const presets = () => screen.getAllByRole("button", { name: /^Fondo / });
const strip = () =>
  screen.getByRole("region", { name: "Beneficios de boosts" });

describe("ServerProfileForm según el nivel de boosts", () => {
  it("nivel 0: banner y fondos fijos bloqueados hasta el nivel 2", () => {
    render(<Form summary={server(0)} />);

    expect(
      screen.queryByRole("button", { name: "Agregar banner" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("group", {
        name: "Banner del servidor: se desbloquea en el nivel 2",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText("Faltan 12 boosts para el nivel 2"),
    ).toHaveLength(2);
    expect(
      screen.getByText("Faltan 2 boosts para el nivel 1"),
    ).toBeInTheDocument();
    for (const preset of presets()) expect(preset).toBeDisabled();
  });

  it("la franja muestra el progreso hasta el próximo nivel", () => {
    render(<Form summary={server(1)} />);

    expect(
      within(strip()).getByRole("progressbar", {
        name: "5 de 15 boosts para el nivel 2",
      }),
    ).toHaveAttribute("aria-valuenow", "5");
    expect(within(strip()).getByText("5 / 15")).toBeInTheDocument();
    expect(within(strip()).getByText("10 boosts")).toBeInTheDocument();
  });

  it("la franja lleva a boostear y a los beneficios", async () => {
    const onBoost = vi.fn();
    const onShowBenefits = vi.fn();
    render(
      <Form
        summary={server(0)}
        onBoost={onBoost}
        onShowBenefits={onShowBenefits}
      />,
    );

    await userEvent.click(
      within(strip()).getByRole("button", { name: "Boostear" }),
    );
    await userEvent.click(
      within(strip()).getByRole("button", { name: /Ver qué suma cada nivel/ }),
    );

    expect(onBoost).toHaveBeenCalledOnce();
    expect(onShowBenefits).toHaveBeenCalledOnce();
  });

  it("sin a dónde llevar, la franja no tiene botones", () => {
    render(<Form summary={server(0)} />);

    expect(within(strip()).queryByRole("button")).not.toBeInTheDocument();
  });

  it("nivel 3: no muestra la franja", () => {
    render(<Form summary={server(3)} />);

    expect(
      screen.queryByRole("region", { name: "Beneficios de boosts" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("desde el nivel 1 el ícono del servidor lleva la insignia GIF", () => {
    const icon = () => screen.getByRole("button", { name: "Cambiar ícono" });
    const { unmount } = render(<Form summary={server(0)} />);
    expect(within(icon()).queryByText("GIF")).not.toBeInTheDocument();
    unmount();

    render(<Form summary={server(2)} />);
    expect(within(icon()).getByText("GIF")).toBeInTheDocument();
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
      screen.queryByRole("button", { name: "Guardar cambios" }),
    ).not.toBeInTheDocument();
  });

  it("nivel 1: acepta un ícono GIF; el banner sigue bloqueado", async () => {
    const { container } = render(<Form summary={server(1)} />);

    expect(iconInput(container).accept).toContain("image/gif");
    expect(screen.getByText("Beneficio del nivel 1")).toBeInTheDocument();
    expect(
      screen.getAllByText("Faltan 10 boosts para el nivel 2"),
    ).toHaveLength(2);
    expect(
      screen.getByText(ANIMATED_SERVER_ICON_COPY.unlocked),
    ).toBeInTheDocument();
    expect(
      screen.getByText("PNG, JPEG, WEBP o GIF · Máx. 5 MB"),
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
