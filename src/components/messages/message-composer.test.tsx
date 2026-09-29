import { SEND_MESSAGE_LABEL } from "@discordia/client-shared";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MessageComposer } from "./message-composer";

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
});
