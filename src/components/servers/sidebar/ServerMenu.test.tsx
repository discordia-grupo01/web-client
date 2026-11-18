import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ServerMenu } from "./ServerMenu";

describe("ServerMenu", () => {
  const defaultProps = {
    canManageServer: false,
    canManageMessages: false,
    canManageChannels: false,
    canManageRoles: false,
    canBanMembers: false,
    canInvite: false,
    boostLevel: 0 as const,
    transferLabel: null,
    pendingReportsLabel: null,
    onClose: vi.fn(),
    onInvite: vi.fn(),
    onOpenBoosts: vi.fn(),
    onOpenSettings: vi.fn(),
    onCreateChannel: vi.fn(),
    onCreateCategory: vi.fn(),
    onTransfer: vi.fn(),
    onLeave: vi.fn(),
  };

  it("miembro sin permisos ve sólo Boosts y Abandonar servidor", () => {
    render(<ServerMenu {...defaultProps} />);

    expect(screen.getByText("Boosts del servidor")).toBeInTheDocument();
    expect(screen.getByText("Abandonar servidor")).toBeInTheDocument();

    expect(screen.queryByText("Invitar miembros")).toBeNull();
    expect(screen.queryByText("Configuración del servidor")).toBeNull();
    expect(screen.queryByText("Crear canal")).toBeNull();
    expect(screen.queryByText("Crear categoría")).toBeNull();
    expect(screen.queryByText("Gestionar roles")).toBeNull();
    expect(screen.queryByText("Gestionar baneos")).toBeNull();
    expect(screen.queryByText("Transferir propiedad")).toBeNull();
  });

  it("con canInvite muestra Invitar miembros", () => {
    render(<ServerMenu {...defaultProps} canInvite={true} />);

    expect(screen.getByText("Invitar miembros")).toBeInTheDocument();
  });

  it("con onNotifications muestra Notificaciones", () => {
    const onNotifications = vi.fn();
    render(<ServerMenu {...defaultProps} onNotifications={onNotifications} />);

    expect(screen.getByText("Notificaciones")).toBeInTheDocument();
  });

  it("con canManageServer muestra Configuración con su descripción", () => {
    render(<ServerMenu {...defaultProps} canManageServer={true} />);

    expect(screen.getByText("Configuración del servidor")).toBeInTheDocument();
    expect(
      screen.getByText("Emojis, roles, baneos y más"),
    ).toBeInTheDocument();
    // Roles y baneos no deben aparecer como filas sueltas en el menú
    expect(screen.queryByText("Gestionar roles")).toBeNull();
    expect(screen.queryByText("Gestionar baneos")).toBeNull();
  });

  it("con canManageRoles muestra Configuración del servidor", () => {
    render(<ServerMenu {...defaultProps} canManageRoles={true} />);

    expect(screen.getByText("Configuración del servidor")).toBeInTheDocument();
    expect(
      screen.getByText("Emojis, roles, baneos y más"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Gestionar roles")).toBeNull();
  });

  it("con canBanMembers muestra Configuración del servidor", () => {
    render(<ServerMenu {...defaultProps} canBanMembers={true} />);

    expect(screen.getByText("Configuración del servidor")).toBeInTheDocument();
    expect(
      screen.getByText("Emojis, roles, baneos y más"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Gestionar baneos")).toBeNull();
  });

  it("con canManageMessages muestra Configuración del servidor", () => {
    render(<ServerMenu {...defaultProps} canManageMessages={true} />);

    expect(screen.getByText("Configuración del servidor")).toBeInTheDocument();
    expect(
      screen.getByText("Emojis, roles, baneos y más"),
    ).toBeInTheDocument();
  });

  it("con canManageChannels muestra Crear canal y Crear categoría", () => {
    render(<ServerMenu {...defaultProps} canManageChannels={true} />);

    expect(screen.getByText("Crear canal")).toBeInTheDocument();
    expect(screen.getByText("Crear categoría")).toBeInTheDocument();
  });

  it("muestra Transferir propiedad para el dueño", () => {
    render(
      <ServerMenu
        {...defaultProps}
        transferLabel="Transferir propiedad"
      />,
    );

    expect(screen.getByText("Transferir propiedad")).toBeInTheDocument();
  });

  it("muestra Responder transferencia cuando hay una transferencia pendiente entrante", () => {
    render(
      <ServerMenu
        {...defaultProps}
        transferLabel="Responder transferencia de propiedad"
      />,
    );

    expect(
      screen.getByText("Responder transferencia de propiedad"),
    ).toBeInTheDocument();
  });

  it("hacer click en una opción cierra el menú y ejecuta la acción", async () => {
    const onClose = vi.fn();
    const onOpenSettings = vi.fn();
    render(
      <ServerMenu
        {...defaultProps}
        canManageServer={true}
        onClose={onClose}
        onOpenSettings={onOpenSettings}
      />,
    );

    await userEvent.click(screen.getByText("Configuración del servidor"));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });
});
