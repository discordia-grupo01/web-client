import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CustomEmojisProvider } from "@/contexts/CustomEmojisContext";

import { CustomEmojiImage } from "./CustomEmojiImage";

const listCustomEmojisRequest = vi.fn();

vi.mock("@/services/custom-emojis/client", () => ({
  listCustomEmojisRequest: (...args: unknown[]) =>
    listCustomEmojisRequest(...args),
}));

const MATE = "0f1d3a9e-2b4c-4d7e-8a1b-5c6d7e8f9012";
const BORRADO = "7a2b4c6d-8e0f-4a1b-9c3d-5e7f9a1b3c5d";

const mate = {
  id: MATE,
  server_id: "s1",
  name: "mate",
  animated: false,
  image_url: "https://cdn.test/mate.png",
  deleted: false,
};

beforeEach(() => {
  vi.resetAllMocks();
  listCustomEmojisRequest.mockResolvedValue({ ok: true, emojis: [mate] });
});

describe("CustomEmojiImage", () => {
  it("dibuja la imagen y pide los ids de la pantalla en una sola tanda", async () => {
    render(
      <CustomEmojisProvider>
        <CustomEmojiImage id={MATE} name="mate" />
        <CustomEmojiImage id={MATE} name="mate" />
        <CustomEmojiImage id={BORRADO} name="fiesta" />
      </CustomEmojisProvider>,
    );

    await waitFor(() =>
      expect(listCustomEmojisRequest).toHaveBeenCalledTimes(1),
    );
    expect(listCustomEmojisRequest).toHaveBeenCalledWith([MATE, BORRADO]);

    const imagenes = await screen.findAllByAltText(":mate:");
    expect(imagenes).toHaveLength(2);
    expect(imagenes[0]).toHaveAttribute("src", "https://cdn.test/mate.png");
  });

  it("el que el back no conoce se lee como se escribe", async () => {
    render(
      <CustomEmojisProvider>
        <CustomEmojiImage id={BORRADO} name="fiesta" />
      </CustomEmojisProvider>,
    );

    expect(screen.getByText(":fiesta:")).toBeInTheDocument();
    await waitFor(() => expect(listCustomEmojisRequest).toHaveBeenCalled());
    expect(screen.getByText(":fiesta:")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("si la tanda falla, deja volver a pedirlo", async () => {
    listCustomEmojisRequest.mockResolvedValue({ ok: false, message: "feo" });

    const { rerender } = render(
      <CustomEmojisProvider>
        <CustomEmojiImage key="primera" id={MATE} name="mate" />
      </CustomEmojisProvider>,
    );
    await waitFor(() => expect(listCustomEmojisRequest).toHaveBeenCalled());
    expect(screen.getByText(":mate:")).toBeInTheDocument();

    listCustomEmojisRequest.mockResolvedValue({ ok: true, emojis: [mate] });
    rerender(
      <CustomEmojisProvider>
        <CustomEmojiImage key="segunda" id={MATE} name="mate" />
      </CustomEmojisProvider>,
    );

    expect(await screen.findByAltText(":mate:")).toBeInTheDocument();
    expect(listCustomEmojisRequest).toHaveBeenCalledTimes(2);
  });
});
