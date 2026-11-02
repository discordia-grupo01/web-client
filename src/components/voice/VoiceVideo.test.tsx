import { fireEvent, render } from "@testing-library/react";
import type { Track } from "livekit-client";
import { describe, expect, it, vi } from "vitest";

import { VoiceVideo } from "./VoiceVideo";

const makeTrack = () =>
  ({ attach: vi.fn(), detach: vi.fn() }) as unknown as Track & {
    attach: ReturnType<typeof vi.fn>;
  };

describe("VoiceVideo", () => {
  it("sin fondo dibuja un solo video", () => {
    const track = makeTrack();
    const { container } = render(<VoiceVideo track={track} fit="contain" />);

    expect(container.querySelectorAll("video")).toHaveLength(1);
    expect(track.attach).toHaveBeenCalledTimes(1);
  });

  it("con fondo rellena los costados con el mismo video difuminado", () => {
    const track = makeTrack();
    const { container } = render(
      <VoiceVideo track={track} fit="contain" hasBackdrop />,
    );
    const [backdrop, main] = Array.from(container.querySelectorAll("video"));

    expect(track.attach).toHaveBeenCalledTimes(2);
    expect(backdrop).toHaveAttribute("aria-hidden", "true");
    expect(backdrop?.className).toContain("blur");
    expect(main?.className).toContain("object-contain");
    expect(main?.className).not.toContain("bg-black");
  });

  it("avisa la proporcion del video cuando la conoce o cambia", () => {
    const onAspectRatioChange = vi.fn();
    const { container } = render(
      <VoiceVideo
        track={makeTrack()}
        fit="contain"
        onAspectRatioChange={onAspectRatioChange}
      />,
    );
    const video = container.querySelector("video")!;
    Object.defineProperty(video, "videoWidth", { value: 720 });
    Object.defineProperty(video, "videoHeight", { value: 1560 });

    fireEvent(video, new Event("resize"));

    expect(onAspectRatioChange).toHaveBeenCalledWith(720 / 1560);
  });
});
