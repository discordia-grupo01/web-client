import type { PremiumView } from "@discordia/client-shared";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const cancelPremiumRequest = vi.fn();
vi.mock("@/services/billing/client", () => ({
  cancelPremiumRequest: () => cancelPremiumRequest(),
}));

import { BILLING_COPY } from "./billingCopy";
import { PremiumCard } from "./PremiumCard";

function premium(overrides: Partial<PremiumView>): PremiumView {
  return {
    state: "none",
    active: false,
    premium_until: null,
    renews: false,
    mp_status: "",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("PremiumCard", () => {
  it("sin Premium ofrece suscribirse y no cancelar", () => {
    render(
      <PremiumCard
        premium={premium({})}
        onSubscribe={vi.fn()}
        onChanged={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: BILLING_COPY.subscribe }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: BILLING_COPY.cancelRenewal }),
    ).not.toBeInTheDocument();
  });

  it("activo sin renovación no ofrece acciones", () => {
    render(
      <PremiumCard
        premium={premium({
          state: "active_canceled",
          active: true,
          premium_until: "2026-12-04T15:00:00Z",
          mp_status: "cancelled",
        })}
        onSubscribe={vi.fn()}
        onChanged={vi.fn()}
      />,
    );

    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(screen.getByText("Activo sin renovación")).toBeInTheDocument();
  });

  it("cancela la renovación después de confirmar", async () => {
    const user = userEvent.setup();
    const onChanged = vi.fn();
    const canceled = premium({
      state: "active_canceled",
      active: true,
      premium_until: "2026-12-04T15:00:00Z",
      mp_status: "cancelled",
    });
    cancelPremiumRequest.mockResolvedValue({ ok: true, premium: canceled });
    render(
      <PremiumCard
        premium={premium({
          state: "active",
          active: true,
          renews: true,
          premium_until: "2026-12-04T15:00:00Z",
          mp_status: "authorized",
        })}
        onSubscribe={vi.fn()}
        onChanged={onChanged}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: BILLING_COPY.cancelRenewal }),
    );
    expect(
      screen.getByText(
        /Conservás los beneficios hasta el 4 de diciembre de 2026/,
      ),
    ).toBeInTheDocument();
    await user.click(
      screen.getAllByRole("button", { name: BILLING_COPY.cancelRenewal })[1],
    );

    expect(cancelPremiumRequest).toHaveBeenCalledTimes(1);
    expect(onChanged).toHaveBeenCalledWith(canceled);
  });
});
