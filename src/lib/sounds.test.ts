import { describe, expect, it, vi } from "vitest";

import { playSound, SOUNDS } from "./sounds";

describe("playSound", () => {
  it("crea un elemento Audio y llama a play", () => {
    const playMock = vi.fn().mockReturnValue(Promise.resolve());
    const originalAudio = globalThis.Audio;
    globalThis.Audio = vi.fn().mockImplementation(() => ({
      play: playMock,
    })) as unknown as typeof Audio;

    try {
      playSound(SOUNDS.DISCONNECT);
      expect(globalThis.Audio).toHaveBeenCalledWith(SOUNDS.DISCONNECT);
      expect(playMock).toHaveBeenCalled();
    } finally {
      globalThis.Audio = originalAudio;
    }
  });

  it("no falla si Audio es undefined", () => {
    const originalAudio = globalThis.Audio;
    // @ts-expect-error simulamos entorno sin Audio
    delete globalThis.Audio;

    try {
      expect(() => playSound(SOUNDS.CALL_REJECTED)).not.toThrow();
    } finally {
      globalThis.Audio = originalAudio;
    }
  });
});
