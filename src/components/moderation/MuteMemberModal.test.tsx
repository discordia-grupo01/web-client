import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MuteMemberModal } from "./MuteMemberModal";

const muteMemberRequest = vi.fn();

vi.mock("@/services/moderation/client", () => ({
  muteMemberRequest: (...args: unknown[]) => muteMemberRequest(...args),
}));

const NOW = new Date("2026-10-12T15:00:00.000Z");

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

function renderModal() {
  const onMuted = vi.fn();
  render(
    <MuteMemberModal
      serverId="s1"
      target={{ userId: "u9", name: "Nova", avatarSrc: null }}
      onClose={vi.fn()}
      onMuted={onMuted}
    />,
  );
  return { onMuted };
}

const confirm = () =>
  userEvent.click(screen.getByRole("button", { name: "Confirmar silencio" }));

describe("MuteMemberModal", () => {
  it("CA1: silencia por la duracion elegida, con motivo", async () => {
    muteMemberRequest.mockResolvedValue({ ok: true });
    const { onMuted } = renderModal();

    await userEvent.click(screen.getByLabelText("10 minutos"));
    await userEvent.type(screen.getByLabelText(/Motivo/), "Spam");
    await confirm();

    expect(muteMemberRequest).toHaveBeenCalledWith("s1", {
      userId: "u9",
      untilAt: "2026-10-12T15:10:00.000Z",
      reason: "Spam",
    });
    expect(
      await screen.findByText(/Nova quedó silenciado hasta/),
    ).toBeInTheDocument();
    expect(onMuted).toHaveBeenCalledTimes(1);
  });

  it("por defecto silencia una hora", async () => {
    muteMemberRequest.mockResolvedValue({ ok: true });
    renderModal();

    await confirm();

    expect(muteMemberRequest).toHaveBeenCalledWith(
      "s1",
      expect.objectContaining({ untilAt: "2026-10-12T16:00:00.000Z" }),
    );
  });

  it("muestra el motivo del rechazo (jerarquia, permiso)", async () => {
    muteMemberRequest.mockResolvedValue({
      ok: false,
      message:
        "No podés silenciar a alguien con un rol igual o superior al tuyo.",
    });
    const { onMuted } = renderModal();

    await confirm();

    expect(await screen.findByText(/rol igual o superior/)).toBeInTheDocument();
    expect(onMuted).not.toHaveBeenCalled();
  });
});
