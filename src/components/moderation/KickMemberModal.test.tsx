import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { KickMemberModal } from "./KickMemberModal";

const kickMemberRequest = vi.fn();

vi.mock("@/services/moderation/client", () => ({
  kickMemberRequest: (...args: unknown[]) => kickMemberRequest(...args),
}));

beforeEach(() => {
  vi.resetAllMocks();
});

function renderModal() {
  const onKicked = vi.fn();
  render(
    <KickMemberModal
      serverId="s1"
      target={{ userId: "u9", name: "Nova", avatarSrc: null }}
      onClose={vi.fn()}
      onKicked={onKicked}
    />,
  );
  return { onKicked };
}

const confirm = () =>
  userEvent.click(screen.getByRole("button", { name: "Confirmar expulsión" }));

describe("KickMemberModal", () => {
  it("CA1: expulsa y avisa que puede volver con una invitacion", async () => {
    kickMemberRequest.mockResolvedValue({ ok: true });
    const { onKicked } = renderModal();

    await confirm();

    expect(kickMemberRequest).toHaveBeenCalledWith("s1", "u9");
    expect(
      await screen.findByText(/Nova fue expulsado del servidor/),
    ).toBeInTheDocument();
    expect(onKicked).toHaveBeenCalledTimes(1);
  });

  it("CA2/CA3: muestra el motivo del rechazo y no lo da por expulsado", async () => {
    kickMemberRequest.mockResolvedValue({
      ok: false,
      message:
        "No podés expulsar a alguien con un rol igual o superior al tuyo.",
    });
    const { onKicked } = renderModal();

    await confirm();

    expect(await screen.findByText(/rol igual o superior/)).toBeInTheDocument();
    expect(onKicked).not.toHaveBeenCalled();
  });
});
