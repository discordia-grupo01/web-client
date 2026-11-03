import {
  NO_NOTIFICATION_SETTINGS,
  type NotificationSettings,
} from "@discordia/client-shared";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { type NotificationSettingsValue } from "@/contexts/NotificationSettingsContext";

const context = vi.hoisted(() => ({
  value: null as NotificationSettingsValue | null,
}));

vi.mock("@/contexts/NotificationSettingsContext", () => ({
  useOptionalNotificationSettings: () => context.value,
}));

vi.mock("@/components/ui/ModalShell", () => ({
  ModalShell: ({ children }: { children: ReactNode }) => (
    <div role="dialog">{children}</div>
  ),
}));

import { NotificationSettingsModal } from "./NotificationSettingsModal";

function setup(
  settings: Partial<NotificationSettings> = {},
  save = vi.fn().mockResolvedValue({ ok: true }),
) {
  context.value = {
    settings: { ...NO_NOTIFICATION_SETTINGS, ...settings },
    setChannel: save,
    setServer: save,
  };
  return save;
}

function renderChannel() {
  const onClose = vi.fn();
  render(
    <NotificationSettingsModal
      scope="channel"
      targetId="c1"
      serverId="s1"
      name="general"
      onClose={onClose}
    />,
  );
  return onClose;
}

describe("NotificationSettingsModal", () => {
  it("no muestra nada sin el contexto de preferencias", () => {
    context.value = null;
    const { container } = render(
      <NotificationSettingsModal
        scope="channel"
        targetId="c1"
        serverId="s1"
        name="general"
        onClose={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("titula con el nombre del canal", () => {
    setup();
    renderChannel();

    expect(
      screen.getByRole("heading", { name: "Notificaciones de #general" }),
    ).toBeInTheDocument();
  });

  it("titula con el nombre del servidor", () => {
    setup();
    render(
      <NotificationSettingsModal
        scope="server"
        targetId="s1"
        serverId="s1"
        name="Mi server"
        onClose={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Notificaciones de Mi server" }),
    ).toBeInTheDocument();
  });

  it("silencia el canal con el interruptor", async () => {
    const save = setup();
    renderChannel();

    const toggle = screen.getByRole("switch", { name: "Silenciar canal" });
    expect(toggle).toHaveAttribute("aria-checked", "false");
    fireEvent.click(toggle);

    await waitFor(() =>
      expect(save).toHaveBeenCalledWith("c1", { muted: true }),
    );
  });

  it("ofrece reactivar un canal silenciado", () => {
    setup({ mutedChannels: { c1: true } });
    renderChannel();

    const toggle = screen.getByRole("switch", { name: "Reactivar canal" });
    expect(toggle).toHaveAttribute("aria-checked", "true");
  });

  it("avisa que el servidor silenciado silencia todos sus canales", () => {
    setup({ mutedServers: { s1: true } });
    renderChannel();

    expect(
      screen.getByText(
        "El servidor está silenciado: todos sus canales también.",
      ),
    ).toBeInTheDocument();
  });

  it("hay una sola lista con los tres niveles", () => {
    setup();
    renderChannel();

    expect(screen.getAllByRole("radio")).toHaveLength(3);
    expect(screen.queryByText("Usar el del servidor")).toBeNull();
  });

  it("marca el nivel propio del canal y deja elegir otro", async () => {
    const save = setup({ channelLevels: { c1: "none" } });
    renderChannel();

    expect(screen.getByRole("radio", { name: /Nada/ })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.queryByText("Heredado del servidor")).toBeNull();

    fireEvent.click(screen.getByRole("radio", { name: /Todos los mensajes/ }));

    await waitFor(() =>
      expect(save).toHaveBeenCalledWith("c1", { level: "all" }),
    );
  });

  it("un canal sin nivel propio marca el del servidor y lo indica", () => {
    setup({ serverLevels: { s1: "all" } });
    renderChannel();

    const inherited = screen.getByRole("radio", { name: /Todos los mensajes/ });
    expect(inherited).toHaveAttribute("aria-checked", "true");
    expect(inherited).toHaveTextContent("Heredado del servidor");
    expect(
      screen.getByRole("radio", { name: /Solo menciones/ }),
    ).toHaveAttribute("aria-checked", "false");
    expect(screen.queryByText("Usar el del servidor")).toBeNull();
  });

  it("sin nada configurado el canal marca solo menciones", () => {
    setup();
    renderChannel();

    expect(
      screen.getByRole("radio", { name: /Solo menciones/ }),
    ).toHaveAttribute("aria-checked", "true");
  });

  it("puede fijar el nivel que hereda tocando el que esta marcado", async () => {
    const save = setup({ serverLevels: { s1: "all" } });
    renderChannel();

    fireEvent.click(screen.getByRole("radio", { name: /Todos los mensajes/ }));

    await waitFor(() =>
      expect(save).toHaveBeenCalledWith("c1", { level: "all" }),
    );
  });

  it("vuelve a heredar con el boton de usar el del servidor", async () => {
    const save = setup({ channelLevels: { c1: "all" } });
    renderChannel();

    fireEvent.click(screen.getByText("Usar el del servidor"));

    await waitFor(() =>
      expect(save).toHaveBeenCalledWith("c1", { level: null }),
    );
  });

  it("no vuelve a guardar el nivel propio que ya estaba elegido", () => {
    const save = setup({ channelLevels: { c1: "all" } });
    renderChannel();

    fireEvent.click(screen.getByRole("radio", { name: /Todos los mensajes/ }));

    expect(save).not.toHaveBeenCalled();
  });

  it("silenciar no cambia el nivel que se muestra", () => {
    setup({ mutedChannels: { c1: true }, channelLevels: { c1: "all" } });
    renderChannel();

    expect(
      screen.getByRole("radio", { name: /Todos los mensajes/ }),
    ).toHaveAttribute("aria-checked", "true");
  });

  it("en un servidor sin nivel marca solo menciones como predeterminado", () => {
    setup();
    render(
      <NotificationSettingsModal
        scope="server"
        targetId="s1"
        serverId="s1"
        name="Mi server"
        onClose={vi.fn()}
      />,
    );

    const fallback = screen.getByRole("radio", { name: /Solo menciones/ });
    expect(fallback).toHaveAttribute("aria-checked", "true");
    expect(fallback).toHaveTextContent("Predeterminado");
    expect(screen.queryByText("Restablecer al predeterminado")).toBeNull();
  });

  it("un servidor con nivel propio ofrece restablecerlo", async () => {
    const save = setup({ serverLevels: { s1: "none" } });
    render(
      <NotificationSettingsModal
        scope="server"
        targetId="s1"
        serverId="s1"
        name="Mi server"
        onClose={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText("Restablecer al predeterminado"));

    await waitFor(() =>
      expect(save).toHaveBeenCalledWith("s1", { level: null }),
    );
  });

  it("guarda las preferencias del servidor con su id", async () => {
    const save = setup();
    render(
      <NotificationSettingsModal
        scope="server"
        targetId="s1"
        serverId="s1"
        name="Mi server"
        onClose={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("switch", { name: "Silenciar servidor" }));

    await waitFor(() =>
      expect(save).toHaveBeenCalledWith("s1", { muted: true }),
    );
  });

  it("muestra el error si no se pudo guardar", async () => {
    setup(
      {},
      vi.fn().mockResolvedValue({ ok: false, message: "Falló el guardado" }),
    );
    renderChannel();

    fireEvent.click(screen.getByRole("switch", { name: "Silenciar canal" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Falló el guardado",
    );
  });
});
