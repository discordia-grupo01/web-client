"use client";

import { vanityInviteLink, VANITY_URL_COPY } from "@discordia/client-shared";
import { Check, Link2 } from "lucide-react";

import { appOrigin, VanityLinkText } from "@/components/invites/VanityLinkText";
import { useCopyLink } from "@/hooks/useCopyLink";

interface VanityUrlSavedProps {
  code: string;
  onChange: () => void;
}

export function VanityUrlSaved({ code, onChange }: VanityUrlSavedProps) {
  const { copied, error, copy } = useCopyLink();

  return (
    <div className="space-y-2">
      <div className="bg-surface-input border-accent flex flex-wrap items-center gap-2.5 rounded-xl border py-2.5 pr-2.5 pl-3.5">
        <Link2 size={16} className="text-content-muted shrink-0" aria-hidden />
        <span className="text-content flex min-w-0 flex-1 text-sm">
          <VanityLinkText code={code} />
        </span>
        <div className="flex shrink-0 gap-1.5">
          <button
            type="button"
            onClick={() => void copy(vanityInviteLink(code, appOrigin()))}
            className="bg-accent text-on-accent flex cursor-pointer items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all hover:brightness-110"
          >
            {copied ? <Check size={13} /> : null}
            {copied ? VANITY_URL_COPY.copied : VANITY_URL_COPY.copy}
          </button>
          <button
            type="button"
            onClick={onChange}
            className="text-content-muted hover:text-content cursor-pointer rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors"
          >
            {VANITY_URL_COPY.change}
          </button>
        </div>
      </div>
      <p
        className={error ? "text-danger text-xs" : "text-content-muted text-xs"}
      >
        {error || VANITY_URL_COPY.savedNote}
      </p>
    </div>
  );
}
