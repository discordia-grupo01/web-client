import { afterEach, describe, expect, it, vi } from "vitest";

const originalAudio = globalThis.Audio;

function fakeAudio(play = vi.fn().mockResolvedValue(undefined)) {
  const element = { play, preload: "", volume: 1, currentTime: 7 };
  const Audio = vi.fn().mockImplementation(() => element);
  globalThis.Audio = Audio as unknown as typeof globalThis.Audio;
  return { play, element, Audio };
}

// Los elementos quedan guardados en el modulo, asi que cada test lo carga limpio.
async function load() {
  vi.resetModules();
  return import("./sounds");
}

afterEach(() => {
  globalThis.Audio = originalAudio;
  vi.restoreAllMocks();
});

describe("playSound", () => {
  it("crea un elemento Audio y llama a play", async () => {
    const { play, Audio } = fakeAudio();
    const { playSound, SOUNDS } = await load();

    playSound(SOUNDS.DISCONNECT);

    expect(Audio).toHaveBeenCalledWith(SOUNDS.DISCONNECT);
    expect(play).toHaveBeenCalled();
  });

  it("reproduce los avisos por debajo del volumen pleno", async () => {
    const { element } = fakeAudio();
    const { playSound, SOUNDS } = await load();

    playSound(SOUNDS.DISCONNECT);

    expect(element.volume).toBeLessThan(1);
  });

  it("reusa el elemento y lo rebobina en vez de crear uno nuevo", async () => {
    const { play, element, Audio } = fakeAudio();
    const { playSound, SOUNDS } = await load();

    playSound(SOUNDS.DISCONNECT);
    playSound(SOUNDS.DISCONNECT);

    expect(Audio).toHaveBeenCalledTimes(1);
    expect(play).toHaveBeenCalledTimes(2);
    expect(element.currentTime).toBe(0);
  });

  it("usa un elemento distinto para cada sonido", async () => {
    const { Audio } = fakeAudio();
    const { playSound, SOUNDS } = await load();

    playSound(SOUNDS.DISCONNECT);
    playSound(SOUNDS.CALL_REJECTED);

    expect(Audio).toHaveBeenCalledTimes(2);
  });

  it("avisa por consola si el navegador bloquea el audio", async () => {
    const blocked = new Error("play() failed because the user didn't interact");
    blocked.name = "NotAllowedError";
    fakeAudio(vi.fn().mockRejectedValue(blocked));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const { playSound, SOUNDS } = await load();

    playSound(SOUNDS.DISCONNECT);
    await Promise.resolve();
    await Promise.resolve();

    expect(warn).toHaveBeenCalled();
  });

  it("no falla si Audio es undefined", async () => {
    // @ts-expect-error simulamos entorno sin Audio
    delete globalThis.Audio;
    const { playSound, SOUNDS } = await load();

    expect(() => playSound(SOUNDS.CALL_REJECTED)).not.toThrow();
  });
});
