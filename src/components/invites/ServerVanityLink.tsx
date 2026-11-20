"use client";

import { vanityInviteLink, VANITY_INVITE_COPY } from "@discordia/client-shared";
import { Check, Copy } from "lucide-react";

import { BoostedBadge } from "@/components/boosts/icons/BoostedBadge";
import { useCopyLink } from "@/hooks/useCopyLink";

import { appOrigin, VanityLinkText } from "./VanityLinkText";

export function ServerVanityLink({ code }: { code: string }) {
  const { copied, error, copy } = useCopyLink();

  return (
    <div className="border-accent bg-surface-raised flex flex-col gap-2 rounded-2xl border p-3.5">
      <div className="flex items-center gap-2">
        <span className="text-content font-display flex-1 text-sm font-semibold">
          {VANITY_INVITE_COPY.title}
        </span>
        <BoostedBadge size={16} />
      </div>
      <div className="flex items-center gap-2">
        <span className="bg-surface-input text-content flex min-w-0 flex-1 rounded-xl px-3 py-2.5 text-sm">
          <VanityLinkText code={code} />
        </span>
        <button
          type="button"
          onClick={() => void copy(vanityInviteLink(code, appOrigin()))}
          className="bg-accent text-on-accent flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all hover:brightness-110"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? VANITY_INVITE_COPY.copied : VANITY_INVITE_COPY.copy}
        </button>
      </div>
      <p className="text-content-subtle text-xs">
        {error || VANITY_INVITE_COPY.note}
      </p>
    </div>
  );
}
