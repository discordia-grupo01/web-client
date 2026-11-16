"use client";

import {
  type BoostLevel,
  canSetVanityUrl,
  VANITY_URL_COPY,
  vanitySlug,
} from "@discordia/client-shared";
import { Lock } from "lucide-react";
import { useState } from "react";

import { BoostBenefitField } from "@/components/boosts/benefits/BoostBenefitField";
import { vanityLinkPrefix } from "@/components/invites/VanityLinkText";
import { useVanityUrl } from "@/components/servers/hooks/useVanityUrl";

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

  const { savedCode } = vanity;

  async function save(code: string) {
    if (await vanity.save(code)) setIsEditing(false);
  }

  return (
    <BoostBenefitField
      perk="vanity_url"
      level={level}
      boostCount={boostCount}
      title={VANITY_URL_COPY.title}
    >
      {!canSetVanityUrl(level) ? (
        <LockedVanityUrl code={savedCode ?? vanitySlug(serverName)} />
      ) : savedCode === null || isEditing ? (
        <VanityUrlEditor
          initialCode={savedCode ?? vanitySlug(serverName)}
          pending={vanity.pending}
          saveError={vanity.error}
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
        <VanityUrlSaved code={savedCode} onChange={() => setIsEditing(true)} />
      )}
    </BoostBenefitField>
  );
}

function LockedVanityUrl({ code }: { code: string }) {
  return (
    <>
      <div
        aria-disabled="true"
        className="border-line-strong bg-surface-input text-content-subtle flex h-11 items-center rounded-xl border border-dashed px-3.5 text-sm"
      >
        <span className="opacity-70">{vanityLinkPrefix()}</span>
        <span className="min-w-0 flex-1 truncate font-semibold opacity-70">
          {code}
        </span>
        <Lock size={15} strokeWidth={2.2} aria-hidden="true" />
      </div>
      <p className="text-content-muted text-xs">{VANITY_URL_COPY.locked}</p>
    </>
  );
}
