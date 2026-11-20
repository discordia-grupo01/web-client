import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useElementSize } from "./useElementSize";

type Callback = (entries: { contentRect: DOMRectReadOnly }[]) => void;

const observed = new Map<Element, Callback>();

class FakeResizeObserver {
  constructor(private readonly callback: Callback) {}
  observe(element: Element) {
    observed.set(element, this.callback);
  }
  disconnect() {
    observed.forEach((callback, element) => {
      if (callback === this.callback) observed.delete(element);
    });
  }
}

function resize(element: Element, width: number, height: number) {
  act(() =>
    observed.get(element)?.([
      { contentRect: { width, height } as DOMRectReadOnly },
    ]),
  );
}

function Measured({ isShown }: { isShown: boolean }) {
  const [ref, size] = useElementSize<HTMLDivElement>();
  return (
    <>
      <p>{`${size.width}x${size.height}`}</p>
      {isShown ? <div ref={ref} data-testid="box" /> : null}
    </>
  );
}

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", FakeResizeObserver);
});
afterEach(() => {
  vi.unstubAllGlobals();
  observed.clear();
});

describe("useElementSize", () => {
  it("sigue midiendo cuando el elemento se desmonta y vuelve", () => {
    const { rerender } = render(<Measured isShown />);
    resize(screen.getByTestId("box"), 800, 600);
    expect(screen.getByText("800x600")).toBeInTheDocument();

    rerender(<Measured isShown={false} />);
    rerender(<Measured isShown />);
    resize(screen.getByTestId("box"), 640, 480);

    expect(screen.getByText("640x480")).toBeInTheDocument();
  });
});
