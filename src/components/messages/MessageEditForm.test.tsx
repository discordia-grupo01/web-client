import type { MentionSources } from "@discordia/client-shared";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MessageMentionsProvider } from "./MentionsContext";
import { MessageEditForm } from "./MessageEditForm";

const sources: MentionSources = {
  members: [
    {
      id: "u_beto",
      name: "Beto",
      avatarUrl: null,
      roleName: null,
      roleColor: null,
    },
  ],
  roles: [],
  canMentionEveryone: false,
};

function renderForm(initialContent: string, onSave = vi.fn()) {
  render(
    <MessageMentionsProvider
      value={{
        sources,
        resolveMention: (kind, id) =>
          kind === "user" && id === "u_beto"
            ? { name: "Beto", color: null }
            : null,
        me: { userId: "me", roleIds: [] },
      }}
    >
      <MessageEditForm
        initialContent={initialContent}
        onSave={onSave}
        onCancel={vi.fn()}
      />
    </MessageMentionsProvider>,
  );
  return { onSave, input: screen.getByRole("textbox") };
}

describe("MessageEditForm con menciones", () => {
  it("muestra @Nombre en vez del token", () => {
    const { input } = renderForm("hola <@u_beto>");
    expect(input).toHaveValue("hola @Beto");
  });

  it("guardar sin tocar la mencion vuelve a mandar el token", async () => {
    const { onSave, input } = renderForm("hola <@u_beto>");

    await userEvent.type(input, " ¿venís?{Enter}");

    expect(onSave).toHaveBeenCalledWith("hola <@u_beto> ¿venís?");
  });

  it("se puede agregar otra mencion desde el selector", async () => {
    const { onSave, input } = renderForm("hola");

    await userEvent.type(input, " @be{Enter}");
    await userEvent.type(input, "ok{Enter}");

    expect(onSave).toHaveBeenCalledWith("hola <@u_beto> ok");
  });
});
