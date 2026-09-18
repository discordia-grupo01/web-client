import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { getProfileImage } from "@/services/profile/service";

describe("getProfileImage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("resolves local image paths against the identify service URL", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("image", { status: 200 }));

    const result = await getProfileImage("/uploads/profile-images/user.jpg");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/uploads/profile-images/user.jpg",
    );
    expect(result.ok).toBe(true);
  });

  it("uses absolute Supabase Storage URLs without prefixing the backend", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("image", { status: 200 }));
    const imageURL =
      "https://project.supabase.co/storage/v1/object/public/profile-images/user.png";

    const result = await getProfileImage(imageURL);

    expect(fetchMock).toHaveBeenCalledWith(imageURL);
    expect(result.ok).toBe(true);
  });
});