import { ANIMATED_SERVER_ICON_COPY } from "@discordia/client-shared";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AnimatedIconField } from "./AnimatedIconField";

function renderField(level: 0 | 1, onPickIcon = vi.fn()) {
  const view = render(
    <AnimatedIconField
      level={level}
      boostCount={level === 0 ? 2 : 7}
      onPickIcon={onPickIcon}
    />,
  );
  return { ...view, onPickIcon };
}

describe("AnimatedIconField", () => {
  it("en el nivel 0 explica el beneficio y no deja subir un GIF", () => {
    renderField(0);

    expect(screen.getByText(ANIMATED_SERVER_ICON_COPY.locked)).toBeTruthy();
    expect(screen.getByText("Faltan 3 boosts para el nivel 1")).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: ANIMATED_SERVER_ICON_COPY.upload }),
    ).toBeNull();
  });

  it("desde el nivel 1 sube el GIF elegido como ícono", async () => {
    const { container, onPickIcon } = renderField(1);
    const gif = new File(["GIF89a"], "party.gif", { type: "image/gif" });

    expect(screen.getByText(ANIMATED_SERVER_ICON_COPY.unlocked)).toBeTruthy();
    expect(screen.getByText(ANIMATED_SERVER_ICON_COPY.badge)).toBeTruthy();
    expect(screen.getByText("Beneficio del nivel 1")).toBeTruthy();
    await userEvent.click(
      screen.getByRole("button", { name: ANIMATED_SERVER_ICON_COPY.upload }),
    );
    await userEvent.upload(
      container.querySelectorAll<HTMLInputElement>('input[type="file"]')[0],
      gif,
    );

    expect(onPickIcon).toHaveBeenCalledWith(gif);
  });
});
