import { RETRY_LABEL } from "@discordia/client-shared";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ConnectionLostNotice } from "./ConnectionLostNotice";

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("ConnectionLostNotice", () => {
  it("Reintentar queda deshabilitado y ocupado hasta que responde el back", async () => {
    let finish: () => void = () => {};
    const onRetry = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    render(<ConnectionLostNotice onRetry={onRetry} />);
    const button = screen.getByRole("button", { name: RETRY_LABEL });
    expect(button).toBeEnabled();

    fireEvent.click(button);
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");

    fireEvent.click(button);
    expect(onRetry).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
      finish();
    });
    expect(button).toBeEnabled();
  });
});
