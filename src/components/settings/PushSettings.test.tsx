import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.hoisted(() => ({
  value: {} as Record<string, unknown>,
}));

vi.mock("@/hooks/usePushNotifications", () => ({
  usePushNotifications: () => push.value,
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: 7 } }),
}));

import { PushSettings } from "./PushSettings";

const setAccountEnabled = vi.fn();
const enableBrowser = vi.fn();
const disableBrowser = vi.fn();

function setup(overrides: Record<string, unknown> = {}) {
  push.value = {
    accountEnabled: true,
    browserStatus: "off",
    isBusy: false,
    error: null,
    setAccountEnabled,
    enableBrowser,
    disableBrowser,
    ...overrides,
  };
  render(<PushSettings />);
}

describe("PushSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("muestra el interruptor de la cuenta encendido", () => {
    setup();

    expect(
      screen.getByRole("switch", { name: "Recibir notificaciones push" }),
    ).toHaveAttribute("aria-checked", "true");
  });

  it("apagar el interruptor lo guarda", () => {
    setup();

    fireEvent.click(screen.getByRole("switch"));

    expect(setAccountEnabled).toHaveBeenCalledWith(false);
  });

  it("encender el interruptor apagado lo guarda", () => {
    setup({ accountEnabled: false });

    fireEvent.click(screen.getByRole("switch"));

    expect(setAccountEnabled).toHaveBeenCalledWith(true);
  });

  it("no deja tocar el interruptor mientras carga", () => {
    setup({ accountEnabled: null });

    expect(screen.getByRole("switch")).toBeDisabled();
  });

  it("ofrece activar este navegador cuando esta apagado", () => {
    setup();

    expect(
      screen.getByText("Este navegador no recibe notificaciones push."),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Activar en este navegador" }),
    );

    expect(enableBrowser).toHaveBeenCalled();
  });

  it("ofrece desactivar este navegador cuando esta activo", () => {
    setup({ browserStatus: "on" });

    expect(
      screen.getByText("Este navegador recibe notificaciones push."),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Desactivar en este navegador" }),
    );

    expect(disableBrowser).toHaveBeenCalled();
  });

  it("deshabilita el boton mientras trabaja o carga", () => {
    setup({ isBusy: true });
    expect(
      screen.getByRole("button", { name: "Activar en este navegador" }),
    ).toBeDisabled();
  });

  it("explica que el navegador no soporta push y no ofrece activar", () => {
    setup({ browserStatus: "unsupported" });

    expect(
      screen.getByText("Este navegador no permite notificaciones push."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /navegador/ })).toBeNull();
  });

  it("explica como desbloquear las notificaciones si fueron bloqueadas", () => {
    setup({ browserStatus: "denied" });

    expect(
      screen.getByText(/Bloqueaste las notificaciones/),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /navegador/ })).toBeNull();
  });

  it("avisa que no llegaran avisos si el navegador esta activo con la cuenta apagada", () => {
    setup({ accountEnabled: false, browserStatus: "on" });

    expect(
      screen.getByText(/ningún dispositivo recibirá avisos/),
    ).toBeInTheDocument();
  });

  it("no da ese aviso si la cuenta esta encendida", () => {
    setup({ accountEnabled: true, browserStatus: "on" });

    expect(screen.queryByText(/ningún dispositivo recibirá avisos/)).toBeNull();
  });

  it("muestra el error", () => {
    setup({ error: "No pudimos guardar" });

    expect(screen.getByRole("alert")).toHaveTextContent("No pudimos guardar");
  });
});
