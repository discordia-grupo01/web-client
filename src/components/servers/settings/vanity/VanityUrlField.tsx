"use client";

import {
  type BoostLevel,
  canSetVanityUrl,
  vanitySlug,
} from "@discordia/client-shared";
import { useState } from "react";

import { BoostPerkHint } from "@/components/boosts/status/BoostPerkHint";
import { useVanityUrl } from "@/components/servers/hooks/useVanityUrl";

import { RemoveVanityModal } from "./RemoveVanityModal";
import { VanityUrlEditor } from "./VanityUrlEditor";
import { VanityUrlSaved } from "./VanityUrlSaved";

interface VanityUrlFieldProps {
  serverId: string;
  serverName: string;
  level: BoostLevel;
  boostCount: number;
  vanityCode: string | null;
}

export function VanityUrlField({
  serverId,
  serverName,
  level,
  boostCount,
  vanityCode,
}: VanityUrlFieldProps) {
  const vanity = useVanityUrl(serverId, vanityCode);
  const [isEditing, setIsEditing] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  if (!canSetVanityUrl(level)) {
    return (
      <BoostPerkHint
        perk="vanity_url"
        level={level}
        boostCount={boostCount}
        unlockedHint=""
      />
    );
  }

  const { savedCode } = vanity;

  async function save(code: string) {
    if (await vanity.save(code)) setIsEditing(false);
  }

  async function remove() {
    if (!(await vanity.save(null))) return;
    setIsRemoving(false);
    setIsEditing(false);
  }

  return (
    <>
      {savedCode === null || isEditing ? (
        <VanityUrlEditor
          initialCode={savedCode ?? vanitySlug(serverName)}
          pending={vanity.pending}
          saveError={isRemoving ? "" : vanity.error}
          onSave={(code) => void save(code)}
          onEdit={vanity.clearError}
          onCancel={
            savedCode === null
              ? undefined
              : () => {
                  vanity.clearError();
                  setIsEditing(false);
                }
          }
        />
      ) : (
        <VanityUrlSaved
          code={savedCode}
          onChange={() => setIsEditing(true)}
          onRemove={() => {
            vanity.clearError();
            setIsRemoving(true);
          }}
        />
      )}
      {isRemoving && savedCode !== null ? (
        <RemoveVanityModal
          code={savedCode}
          pending={vanity.pending}
          error={vanity.error}
          onConfirm={() => void remove()}
          onClose={() => {
            vanity.clearError();
            setIsRemoving(false);
          }}
        />
      ) : null}
    </>
  );
}
