import { VOICE_CALL_DURATION_LABEL } from "@discordia/client-shared";

import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CallDuration } from "./CallDuration";

const START = Date.parse("2026-11-01T16:00:00Z");

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(START + (12 * 60 + 34) * 1000);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("CallDuration", () => {
  it("muestra hace cuanto empezo la llamada y avanza", () => {
    render(<CallDuration startedAt={START} />);
    expect(screen.getByText("12:34")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(2000));

    expect(screen.getByText("12:36")).toBeInTheDocument();
  });

  it("se anuncia con su etiqueta", () => {
    render(<CallDuration startedAt={START} />);
    expect(
      screen.getByLabelText(`${VOICE_CALL_DURATION_LABEL}: 12:34`),
    ).toBeInTheDocument();
  });

  it("no muestra tiempo negativo si el reloj local esta atrasado", () => {
    render(<CallDuration startedAt={Date.now() + 5000} />);
    expect(screen.getByText("0:00")).toBeInTheDocument();
  });
});
