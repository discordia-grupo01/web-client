import {
  type MentionSources,
  SEND_MESSAGE_LABEL,
} from "@discordia/client-shared";

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("./MessageEditor", () => import("./MessageEditor.fake"));

vi.mock("@/services/attachments/client", () => ({
  uploadAttachmentRequest: vi.fn(),
}));

import { uploadAttachmentRequest } from "@/services/attachments/client";

import { MessageMentionsProvider } from "@/contexts/MentionsContext";
import { OwnProfileProvider } from "@/contexts/OwnProfileContext";
import { MessageComposer } from "./MessageComposer";

function renderComposer(onSend = vi.fn()) {
  render(
    <MessageComposer
      placeholder="Mensaje en #general"
      onSend={onSend}
      uploadTarget={{ channelId: "c1" }}
    />,
  );
  return { onSend, input: screen.getByRole("textbox") };
}

function draftMentions(): string[] {
  return within(screen.getByTestId("draft-mentions"))
    .queryAllByRole("listitem")
    .map((item) => item.textContent ?? "");
}

describe("MessageComposer", () => {
  it("Enter envia el mensaje y limpia la caja", async () => {
    const { onSend, input } = renderComposer();

    await userEvent.type(input, "hola{Enter}");

    expect(onSend).toHaveBeenCalledWith("hola", []);
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

    expect(onSend).toHaveBeenCalledWith("desde el boton", []);
  });

  it("@everyone sin selector (sin permiso o en un DM) se envia tal cual, como texto", async () => {
    const { onSend, input } = renderComposer();

    await userEvent.type(input, "@everyone hola{Enter}");

    expect(onSend).toHaveBeenCalledWith("@everyone hola", []);
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
          <MessageComposer
            placeholder="Mensaje en #general"
            onSend={onSend}
            uploadTarget={{ channelId: "c1" }}
          />
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

      expect(onSend).toHaveBeenCalledWith("Hola <@u_beto> mirá esto", []);
    });

    it("elegir con un clic tambien funciona", async () => {
      const { onSend, input } = renderWithMentions(true);

      await userEvent.type(input, "@dis");
      await userEvent.click(screen.getByRole("option", { name: /Diseño/ }));
      await userEvent.type(input, "hola{Enter}");

      expect(onSend).toHaveBeenCalledWith("<@&r1> hola", []);
    });

    it("la mencion elegida queda marcada en el borrador", async () => {
      const { input } = renderWithMentions(true);

      await userEvent.type(input, "@be{Enter}sigo");

      expect(draftMentions()).toEqual(["@Beto"]);
    });

    it("@everyone se resalta solo con permiso", async () => {
      const withPermission = renderWithMentions(true);
      await userEvent.type(withPermission.input, "hola @everyone ");
      expect(draftMentions()).toEqual(["@everyone"]);
    });

    it("sin permiso @everyone queda sin resaltar, como texto comun", async () => {
      const { input } = renderWithMentions(false);
      await userEvent.type(input, "hola @everyone ");
      expect(draftMentions()).toEqual([]);
    });

    it("un @Nombre escrito a mano no se resalta", async () => {
      const { input } = renderWithMentions(true);
      await userEvent.type(input, "hola @Beto{Escape} ");
      expect(draftMentions()).toEqual([]);
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

      expect(onSend).toHaveBeenCalledWith("hola @Beto", []);
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

describe("MessageComposer con adjuntos", () => {
  beforeAll(() => {
    // jsdom no implementa las URLs de objeto que usa la miniatura.
    URL.createObjectURL = vi.fn(() => "blob:miniatura");
    URL.revokeObjectURL = vi.fn();
  });

  function chooseFiles(files: File[]) {
    const input =
      document.querySelector<HTMLInputElement>('input[type="file"]');
    return userEvent.upload(input!, files, { applyAccept: false });
  }

  it("rechaza un formato no permitido con un error descriptivo", async () => {
    renderComposer();

    await chooseFiles([new File(["x"], "a.zip", { type: "application/zip" })]);

    expect(await screen.findByText(/Formato no soportado/)).toBeInTheDocument();
    expect(screen.queryByText("a.zip")).not.toBeInTheDocument();
  });

  it("rechaza un archivo que supera el tamaño maximo", async () => {
    renderComposer();
    const big = new File(["x"], "grande.pdf", { type: "application/pdf" });
    Object.defineProperty(big, "size", { value: 11 * 1024 * 1024 });

    await chooseFiles([big]);

    expect(await screen.findByText(/tamaño máximo/)).toBeInTheDocument();
    expect(screen.queryByText("grande.pdf")).not.toBeInTheDocument();
  });

  it("sube el archivo y manda su id con el mensaje, aun sin texto", async () => {
    vi.mocked(uploadAttachmentRequest).mockResolvedValue({
      ok: true,
      attachment: {
        id: "a1",
        url: "https://x/a1.png",
        name: "foto.png",
        content_type: "image/png",
        size: 10,
      },
    });
    const { onSend } = renderComposer();

    await chooseFiles([new File(["x"], "foto.png", { type: "image/png" })]);
    await userEvent.click(
      screen.getByRole("button", { name: SEND_MESSAGE_LABEL }),
    );

    await waitFor(() => expect(onSend).toHaveBeenCalledWith("", ["a1"]));
    expect(uploadAttachmentRequest).toHaveBeenCalledWith(expect.any(File), {
      channelId: "c1",
    });
  });

  it("si la subida falla muestra el error y no envia", async () => {
    vi.mocked(uploadAttachmentRequest).mockResolvedValue({
      ok: false,
      message: "No se pudo guardar el archivo",
    });
    const { onSend } = renderComposer();

    await chooseFiles([new File(["x"], "foto.png", { type: "image/png" })]);
    await userEvent.click(
      screen.getByRole("button", { name: SEND_MESSAGE_LABEL }),
    );

    expect(
      await screen.findByText("No se pudo guardar el archivo"),
    ).toBeInTheDocument();
    expect(onSend).not.toHaveBeenCalled();
  });
});

describe("MessageComposer con adjuntos Premium", () => {
  beforeAll(() => {
    URL.createObjectURL = vi.fn(() => "blob:miniatura");
    URL.revokeObjectURL = vi.fn();
  });

  function renderAs(premium: boolean) {
    render(
      <OwnProfileProvider
        value={{
          profile: {
            id: "u1",
            name: "Ana",
            email: "ana@example.com",
            description: "",
            avatar_url: "",
            status_text: "",
            status_emoji: "",
            premium,
            created_at: "2026-01-01T00:00:00Z",
          },
          refresh: vi.fn(),
        }}
      >
        <MessageComposer
          placeholder="Mensaje en #general"
          onSend={vi.fn()}
          uploadTarget={{ channelId: "c1" }}
        />
      </OwnProfileProvider>,
    );
    return document.querySelector<HTMLInputElement>('input[type="file"]')!;
  }

  function sized(name: string, type: string, megabytes: number) {
    const file = new File(["x"], name, { type });
    Object.defineProperty(file, "size", { value: megabytes * 1024 * 1024 });
    return file;
  }

  it("sin Premium rechaza un GIF", async () => {
    const input = renderAs(false);

    await userEvent.upload(input, [sized("a.gif", "image/gif", 1)], {
      applyAccept: false,
    });

    expect(await screen.findByText(/Formato no soportado/)).toBeInTheDocument();
    expect(input.accept).not.toContain("image/gif");
  });

  it("con Premium acepta un GIF y un archivo de 40 MB", async () => {
    const input = renderAs(true);

    await userEvent.upload(
      input,
      [
        sized("a.gif", "image/gif", 1),
        sized("grande.pdf", "application/pdf", 40),
      ],
      { applyAccept: false },
    );

    expect(await screen.findByText("a.gif")).toBeInTheDocument();
    expect(screen.getByText("grande.pdf")).toBeInTheDocument();
    expect(screen.queryByText(/Formato no soportado/)).toBeNull();
    expect(input.accept).toContain("image/gif");
  });

  it("con Premium rechaza un archivo de mas de 50 MB", async () => {
    const input = renderAs(true);

    await userEvent.upload(
      input,
      [sized("enorme.pdf", "application/pdf", 51)],
      { applyAccept: false },
    );

    expect(await screen.findByText(/tamaño máximo/)).toBeInTheDocument();
    expect(screen.queryByText("enorme.pdf")).toBeNull();
  });
});
