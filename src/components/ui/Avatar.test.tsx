import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Avatar } from "./Avatar";

describe("Avatar", () => {
  it("muestra la inicial cuando no hay src", () => {
    const { container } = render(<Avatar name="Física" src={null} />);

    expect(screen.getByText("F")).toBeInTheDocument();
    expect(container.querySelector("img")).toBeNull();
  });

  it("muestra la imagen cuando hay src", () => {
    const { container } = render(<Avatar name="Física" src="/icon.png" />);

    expect(container.querySelector("img")).toHaveAttribute("src", "/icon.png");
  });

  it("cae a la inicial si la imagen no carga", () => {
    const { container } = render(<Avatar name="Física" src="/roto.png" />);

    fireEvent.error(container.querySelector("img")!);

    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("F")).toBeInTheDocument();
  });

  it("vuelve a intentar con la imagen cuando cambia el src", () => {
    const { container, rerender } = render(
      <Avatar name="Física" src="/roto.png" />,
    );
    fireEvent.error(container.querySelector("img")!);

    rerender(<Avatar name="Física" src="/nuevo.png" />);

    expect(container.querySelector("img")).toHaveAttribute("src", "/nuevo.png");
  });
});
