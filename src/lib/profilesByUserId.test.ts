import { describe, expect, it } from "vitest";

import { profilesByUserId } from "./profilesByUserId";

const profile = {
  name: "Nova",
  avatar_url: "",
  description: "",
  status_text: "",
  status_emoji: "",
};

describe("profilesByUserId", () => {
  it("indexa el perfil de cada usuario", () => {
    expect(
      profilesByUserId([
        { user_id: "u1", profile },
        { user_id: "u2", profile: { ...profile, name: "Luna" } },
      ]),
    ).toEqual({ u1: profile, u2: { ...profile, name: "Luna" } });
  });

  it("deja afuera a los que todavia no tienen perfil replicado", () => {
    expect(
      profilesByUserId([
        { user_id: "u1", profile },
        { user_id: "u2", profile: null },
        { user_id: "u3" },
      ]),
    ).toEqual({ u1: profile });
  });
});
