import {
  CHAT_OFFLINE_TITLE,
  DM_CONVERSATIONS_LOAD_FAILED,
  RETRY_LABEL,
} from "@discordia/client-shared";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DmListError } from "./DmListError";

describe("DmListError", () => {
  it("sin conexion es una sola linea: Sin conexion, sin repetir la explicacion del chat", () => {
    render(
      <DmListError
        message={DM_CONVERSATIONS_LOAD_FAILED}
        isOffline
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByText(CHAT_OFFLINE_TITLE)).toBeInTheDocument();
    expect(screen.queryByText(DM_CONVERSATIONS_LOAD_FAILED)).toBeNull();
  });

  it("con otro error muestra el motivo que llego", () => {
    render(
      <DmListError
        message={DM_CONVERSATIONS_LOAD_FAILED}
        isOffline={false}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByText(DM_CONVERSATIONS_LOAD_FAILED)).toBeInTheDocument();
    expect(screen.queryByText(CHAT_OFFLINE_TITLE)).toBeNull();
  });

  it("sin conexion no tiene botones: el reintento esta en el panel del chat", () => {
    render(
      <DmListError
        message={DM_CONVERSATIONS_LOAD_FAILED}
        isOffline
        onRetry={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button")).toBeNull();
  });

  it("con error del servidor, Reintentar vuelve a pedir la lista", () => {
    const onRetry = vi.fn();
    render(
      <DmListError
        message={DM_CONVERSATIONS_LOAD_FAILED}
        isOffline={false}
        onRetry={onRetry}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: RETRY_LABEL }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
