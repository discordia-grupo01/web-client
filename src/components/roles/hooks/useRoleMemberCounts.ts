"use client";

import type { Role } from "@discordia/client-shared";
import { useEffect, useState } from "react";

import { listRoleMembersRequest } from "@/services/roles/client";

export function useRoleMemberCounts(roles: Role[] | null, selectedId: string) {
  const [roleMemberCounts, setRoleMemberCounts] = useState<
    Record<string, number>
  >({});

  const roleIdsKey = (roles ?? [])
    .filter((role) => !role.is_everyone)
    .map((role) => role.id)
    .join(",");
  useEffect(() => {
    if (!roleIdsKey) return;
    let cancelled = false;
    for (const roleId of roleIdsKey.split(",")) {
      listRoleMembersRequest(roleId, { limit: 1 }).then((result) => {
        if (cancelled || !result.ok) return;
        setRoleMemberCounts((prev) =>
          prev[roleId] === undefined
            ? { ...prev, [roleId]: result.total }
            : prev,
        );
      });
    }
    return () => {
      cancelled = true;
    };
  }, [roleIdsKey]);

  // Se pide al elegir un rol, así el contador del encabezado ya es el real.
  useEffect(() => {
    if (!selectedId || roleMemberCounts[selectedId] !== undefined) return;
    let cancelled = false;
    listRoleMembersRequest(selectedId, { limit: 1 }).then((result) => {
      if (cancelled || !result.ok) return;
      setRoleMemberCounts((prev) => ({ ...prev, [selectedId]: result.total }));
    });
    return () => {
      cancelled = true;
    };
  }, [selectedId, roleMemberCounts]);

  function handleMembershipChange(delta: 1 | -1) {
    setRoleMemberCounts((prev) =>
      prev[selectedId] === undefined
        ? prev
        : { ...prev, [selectedId]: prev[selectedId] + delta },
    );
  }

  return {
    roleMemberCounts,
    selectedMemberCount: roleMemberCounts[selectedId],
    handleMembershipChange,
  };
}
