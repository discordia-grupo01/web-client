import { ROLE_PERMISSIONS } from "@discordia/client-shared";
import { describe, expect, it } from "vitest";

import { ROLE_PERMISSION_GROUPS } from "./permissionGroups";

describe("ROLE_PERMISSION_GROUPS", () => {
  it("muestra cada permiso del rol exactamente una vez", () => {
    const grouped = ROLE_PERMISSION_GROUPS.flatMap(
      (group) => group.permissions,
    );
    expect([...grouped].sort()).toEqual([...ROLE_PERMISSIONS].sort());
  });
});
