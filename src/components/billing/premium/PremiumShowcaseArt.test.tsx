import { PREMIUM_SHOWCASE_ART_COPY } from "@discordia/client-shared";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PremiumShowcaseArt } from "./PremiumShowcaseArt";

describe("PremiumShowcaseArt", () => {
  it("la insignia muestra el nombre real del perfil propio", () => {
    render(
      <PremiumShowcaseArt
        benefit="badge"
        profile={{ name: "Juana", avatar_url: "" }}
      />,
    );

    expect(screen.getByText("Juana")).toBeInTheDocument();
    expect(
      screen.getByText(PREMIUM_SHOWCASE_ART_COPY.profileLabel),
    ).toBeInTheDocument();
  });

  it("los adjuntos muestran el límite de siempre tachado y el de Premium", () => {
    render(<PremiumShowcaseArt benefit="attachments" profile={null} />);

    expect(
      screen.getByText(PREMIUM_SHOWCASE_ART_COPY.attachmentBaseLimit),
    ).toHaveClass("line-through");
    expect(
      screen.getByText(PREMIUM_SHOWCASE_ART_COPY.attachmentLimit),
    ).toBeInTheDocument();
  });
});
