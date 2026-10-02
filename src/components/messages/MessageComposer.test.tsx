import { SEND_MESSAGE_LABEL } from "@discordia/client-shared";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MessageComposer } from "./MessageComposer";

function renderComposer(onSend = vi.fn()) {
  render(<MessageComposer channelName="general" onSend={onSend} />);
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

  it("bloquea @everyone sin el permiso y no envia", async () => {
    const onSend = vi.fn();
    render(<MessageComposer channelName="general" onSend={onSend} />);

    await userEvent.type(screen.getByRole("textbox"), "@everyone hola{Enter}");

    expect(onSend).not.toHaveBeenCalled();
    expect(
      screen.getByText("No tenés permiso para mencionar a todo el servidor."),
    ).toBeInTheDocument();
  });

  it("permite @everyone con el permiso", async () => {
    const onSend = vi.fn();
    render(
      <MessageComposer
        channelName="general"
        onSend={onSend}
        canMentionEveryone
      />,
    );

    await userEvent.type(screen.getByRole("textbox"), "@everyone hola{Enter}");

    expect(onSend).toHaveBeenCalledWith("@everyone hola");
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
