import {
  type MentionSources,
  SEND_MESSAGE_LABEL,
} from "@discordia/client-shared";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MessageMentionsProvider } from "./MentionsContext";
import { MessageComposer } from "./MessageComposer";

function renderComposer(onSend = vi.fn()) {
  render(<MessageComposer placeholder="Mensaje en #general" onSend={onSend} />);
  return { onSend, input: screen.getByRole("textbox") };
}

describe("MessageComposer", () => {
  it("Enter envia el mensaje y limpia la caja", async () => {
    const { onSend, input } = renderComposer();

    await userEvent.type(input, "hola{Enter}");

    expect(onSend).toHaveBeenCalledWith("hola");
    expect(input).toHaveValue("");
  });

  it("Shift+Enter agrega un salto de linea sin enviar", async () => {
    const { onSend, input } = renderComposer();

    await userEvent.type(input, "hola{Shift>}{Enter}{/Shift}chau");

    expect(onSend).not.toHaveBeenCalled();
    expect(input).toHaveValue("hola\nchau");
  });

  it("no envia un mensaje vacio", async () => {
    const { onSend, input } = renderComposer();

    await userEvent.type(input, "   {Enter}");

    expect(onSend).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: SEND_MESSAGE_LABEL }),
    ).toBeDisabled();
  });

  it("el boton de enviar manda el mensaje", async () => {
    const { onSend, input } = renderComposer();

    await userEvent.type(input, "desde el boton");
    await userEvent.click(
      screen.getByRole("button", { name: SEND_MESSAGE_LABEL }),
    );

    expect(onSend).toHaveBeenCalledWith("desde el boton");
  });

  it("@everyone sin selector (sin permiso o en un DM) se envia tal cual, como texto", async () => {
    const { onSend, input } = renderComposer();

    await userEvent.type(input, "@everyone hola{Enter}");

    expect(onSend).toHaveBeenCalledWith("@everyone hola");
  });

  describe("menciones", () => {
    function renderWithMentions(canMentionEveryone: boolean) {
      const onSend = vi.fn();
      const sources: MentionSources = {
        members: [
          {
            id: "u_beto",
            name: "Beto",
            avatarUrl: null,
            roleName: null,
            roleColor: null,
          },
          {
            id: "u_ana",
            name: "Ana",
            avatarUrl: null,
            roleName: null,
            roleColor: null,
          },
        ],
        roles: [
          { id: "r1", name: "Diseño", color: "#111111", is_everyone: false },
        ],
        canMentionEveryone,
      };
      render(
        <MessageMentionsProvider
          value={{ sources, me: { userId: "u_ana", roleIds: [] } }}
        >
          <MessageComposer placeholder="Mensaje en #general" onSend={onSend} />
        </MessageMentionsProvider>,
      );
      return { onSend, input: screen.getByRole("textbox") };
    }

    it("al escribir @ ofrece miembros, y roles y @everyone solo con permiso", async () => {
      const { input } = renderWithMentions(true);

      await userEvent.type(input, "@");

      expect(screen.getByRole("option", { name: /Beto/ })).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: /Diseño/ }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: /everyone/ }),
      ).toBeInTheDocument();
    });

    it("sin el permiso solo ofrece miembros", async () => {
      const { input } = renderWithMentions(false);

      await userEvent.type(input, "@");

      expect(screen.getByRole("option", { name: /Beto/ })).toBeInTheDocument();
      expect(screen.queryByRole("option", { name: /Diseño/ })).toBeNull();
      expect(screen.queryByRole("option", { name: /everyone/ })).toBeNull();
    });

    it("filtra mientras se escribe", async () => {
      const { input } = renderWithMentions(true);

      await userEvent.type(input, "@be");

      expect(screen.getByRole("option", { name: /Beto/ })).toBeInTheDocument();
      expect(screen.queryByRole("option", { name: /Ana/ })).toBeNull();
    });

    it("elegir con Enter inserta @Nombre y se envia el token con el id", async () => {
      const { onSend, input } = renderWithMentions(true);

      await userEvent.type(input, "Hola @be{Enter}");
      expect(input).toHaveValue("Hola @Beto ");
      expect(onSend).not.toHaveBeenCalled();

      await userEvent.type(input, "mirá esto{Enter}");

      expect(onSend).toHaveBeenCalledWith("Hola <@u_beto> mirá esto");
    });

    it("elegir con un clic tambien funciona", async () => {
      const { onSend, input } = renderWithMentions(true);

      await userEvent.type(input, "@dis");
      await userEvent.click(screen.getByRole("option", { name: /Diseño/ }));
      await userEvent.type(input, "hola{Enter}");

      expect(onSend).toHaveBeenCalledWith("<@&r1> hola");
    });

    it("Esc cierra la lista sin elegir nada", async () => {
      const { input } = renderWithMentions(true);

      await userEvent.type(input, "@be{Escape}");

      expect(screen.queryByRole("listbox")).toBeNull();
      expect(input).toHaveValue("@be");
    });

    it("un @Nombre escrito a mano sin elegirlo se envia como texto", async () => {
      const { onSend, input } = renderWithMentions(true);

      await userEvent.type(input, "hola @Beto{Escape}{Enter}");

      expect(onSend).toHaveBeenCalledWith("hola @Beto");
    });
  });

  describe("envio asincrono", () => {
    it("conserva el borrador hasta que el envio sale bien", async () => {
      let resolveSend: (result: { ok: true }) => void = () => {};
      const onSend = vi.fn(
        () => new Promise<{ ok: true }>((resolve) => (resolveSend = resolve)),
      );
      const { input } = renderComposer(onSend);

      await userEvent.type(input, "hola{Enter}");
      expect(input).toHaveValue("hola");

      resolveSend({ ok: true });
      await waitFor(() => expect(input).toHaveValue(""));
    });

    it("si falla deja el texto y muestra el error", async () => {
      const onSend = vi.fn().mockResolvedValue({
        ok: false,
        message: "No pudimos enviar el mensaje. Intentá de nuevo.",
      });
      const { input } = renderComposer(onSend);

      await userEvent.type(input, "hola{Enter}");

      expect(
        await screen.findByText(
          "No pudimos enviar el mensaje. Intentá de nuevo.",
        ),
      ).toBeInTheDocument();
      expect(input).toHaveValue("hola");
    });

    it("el error se va al seguir escribiendo", async () => {
      const onSend = vi
        .fn()
        .mockResolvedValue({ ok: false, message: "Falló el envío." });
      const { input } = renderComposer(onSend);
      await userEvent.type(input, "hola{Enter}");
      await screen.findByText("Falló el envío.");

      await userEvent.type(input, "!");

      expect(screen.queryByText("Falló el envío.")).not.toBeInTheDocument();
    });

    it("no envia dos veces mientras el primero sigue en curso", async () => {
      const onSend = vi.fn(() => new Promise<{ ok: true }>(() => {}));
      const { input } = renderComposer(onSend);

      await userEvent.type(input, "hola{Enter}");
      await userEvent.click(
        screen.getByRole("button", { name: SEND_MESSAGE_LABEL }),
      );

      expect(onSend).toHaveBeenCalledTimes(1);
    });
  });
});
