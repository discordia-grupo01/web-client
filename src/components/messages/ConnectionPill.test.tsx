import {
  CHAT_OFFLINE_TITLE,
  RETRY_LABEL,
  CHAT_RECONNECTING_NOTICE,
  CONNECTION_NOTICE_DELAY_MS,
  type ChatStatus,
} from "@discordia/client-shared";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ConnectionPill } from "./ConnectionPill";

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("ConnectionPill", () => {
  it("con el chat listo no muestra nada", () => {
    const { container } = render(
      <ConnectionPill status="ready" onRetry={vi.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("Reconectando espera un momento antes de aparecer, para no parpadear en un corte corto", () => {
    render(<ConnectionPill status="reconnecting" onRetry={vi.fn()} />);
    expect(screen.queryByText(CHAT_RECONNECTING_NOTICE)).toBeNull();

    act(() => {
      vi.advanceTimersByTime(CONNECTION_NOTICE_DELAY_MS - 1);
    });
    expect(screen.queryByText(CHAT_RECONNECTING_NOTICE)).toBeNull();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByText(CHAT_RECONNECTING_NOTICE)).toBeInTheDocument();
  });

  it("si la conexion vuelve antes de la espera, no llega a verse", () => {
    const { rerender, container } = render(
      <ConnectionPill status="reconnecting" onRetry={vi.fn()} />,
    );
    act(() => {
      vi.advanceTimersByTime(CONNECTION_NOTICE_DELAY_MS - 100);
    });

    rerender(<ConnectionPill status="ready" onRetry={vi.fn()} />);
    act(() => {
      vi.advanceTimersByTime(CONNECTION_NOTICE_DELAY_MS);
    });

    expect(container).toBeEmptyDOMElement();
  });

  it("al reconectar se oculta en el acto", () => {
    const { rerender, container } = render(
      <ConnectionPill status="reconnecting" onRetry={vi.fn()} />,
    );
    act(() => {
      vi.advanceTimersByTime(CONNECTION_NOTICE_DELAY_MS);
    });
    expect(screen.getByText(CHAT_RECONNECTING_NOTICE)).toBeInTheDocument();

    rerender(<ConnectionPill status="ready" onRetry={vi.fn()} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("sin conexion se muestra enseguida, sin esperar, y no manda a recargar la pagina", () => {
    render(<ConnectionPill status="offline" onRetry={vi.fn()} />);

    const pill = screen.getByRole("alert");
    expect(pill).toHaveTextContent(CHAT_OFFLINE_TITLE);
    expect(pill).not.toHaveTextContent(/recarg/i);
  });

  it("sin conexion ofrece Reintentar", () => {
    const onRetry = vi.fn();
    render(<ConnectionPill status="offline" onRetry={onRetry} />);

    fireEvent.click(screen.getByRole("button", { name: RETRY_LABEL }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it.each<ChatStatus>(["loading", "forbidden", "notFound", "error"])(
    "con el estado %s no muestra la franja",
    (status) => {
      const { container } = render(
        <ConnectionPill status={status} onRetry={vi.fn()} />,
      );

      expect(container).toBeEmptyDOMElement();
    },
  );
});
