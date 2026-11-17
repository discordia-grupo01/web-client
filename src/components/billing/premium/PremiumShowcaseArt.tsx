import {
  PREMIUM_SHOWCASE_ART_COPY as ART_COPY,
  type PremiumBenefitId,
  type User,
} from "@discordia/client-shared";
import { Smile } from "lucide-react";

import { Avatar } from "@/components/ui/Avatar";
import { ownAvatarSrc } from "@/utils/ownAvatar";

import { PremiumPill } from "./PremiumPill";

const EMOJI_TILES = [
  "bg-accent text-boost-paper",
  "bg-info text-boost-ink",
  "bg-sky text-boost-ink",
];

const SERVER_TILES = ["bg-accent", "bg-info", "bg-sky"];

export type PremiumArtProfile = Pick<User, "name" | "avatar_url">;

interface PremiumShowcaseArtProps {
  benefit: PremiumBenefitId;
  profile: PremiumArtProfile | null;
}

export function PremiumShowcaseArt({
  benefit,
  profile,
}: PremiumShowcaseArtProps) {
  return (
    <div
      aria-hidden="true"
      className="bg-surface-sunken flex h-24 items-center justify-center gap-2.5 overflow-hidden rounded-xl p-3"
    >
      <Art benefit={benefit} profile={profile} />
    </div>
  );
}

function Art({ benefit, profile }: PremiumShowcaseArtProps) {
  switch (benefit) {
    case "attachments":
      return (
        <>
          <span className="text-boost-ink flex h-12.5 w-10.5 shrink-0 items-center justify-center rounded-lg bg-[#F0B232] text-[10px] font-bold">
            {ART_COPY.attachmentKind}
          </span>
          <span className="flex flex-1 flex-col gap-1.5">
            <span className="text-content text-[11px] font-semibold">
              {ART_COPY.attachmentName}
            </span>
            <span className="bg-surface-input h-1.25 overflow-hidden rounded-sm">
              <span className="block h-full w-full bg-[#F0B232]" />
            </span>
            <span className="text-[10px] tabular-nums">
              <span className="text-content-subtle line-through">
                {ART_COPY.attachmentBaseLimit}
              </span>{" "}
              <strong className="text-[#F0B232]">
                {ART_COPY.attachmentLimit}
              </strong>
            </span>
          </span>
        </>
      );
    case "animated":
      return (
        <>
          {EMOJI_TILES.map((tile) => (
            <span
              key={tile}
              className={`flex size-8.5 items-center justify-center rounded-[10px] ${tile}`}
            >
              <Smile size={16} />
            </span>
          ))}
          <span className="text-boost-ink flex h-8.5 items-center rounded-[10px] bg-[#F0B232] px-2.5 text-xs font-bold">
            {ART_COPY.animatedKind}
          </span>
        </>
      );
    case "global-emojis":
      return (
        <>
          <span className="flex shrink-0 -space-x-2.5">
            {SERVER_TILES.map((tile) => (
              <span
                key={tile}
                className={`ring-surface-sunken size-9 rounded-xl ring-2 ${tile}`}
              />
            ))}
          </span>
          <span className="flex min-w-0 flex-col gap-1">
            <span className="text-content text-[11px] font-bold">
              {ART_COPY.globalEmojisTitle}
            </span>
            <span className="text-content-muted text-[10px]">
              {ART_COPY.globalEmojisHint}
            </span>
          </span>
        </>
      );
    case "badge":
      return (
        <>
          <Avatar
            name={profile?.name ?? ""}
            src={profile ? ownAvatarSrc(profile) : null}
            size={44}
            className="shrink-0 rounded-full"
          />
          <span className="flex min-w-0 flex-col gap-1">
            <span className="flex min-w-0 items-center gap-1.5">
              {profile ? (
                <span className="text-content truncate text-xs font-bold">
                  {profile.name}
                </span>
              ) : (
                <span className="bg-line-strong h-2 w-16 rounded-sm" />
              )}
              <PremiumPill />
            </span>
            <span className="text-content-muted text-[10px] font-semibold">
              {ART_COPY.profileLabel}
            </span>
          </span>
        </>
      );
  }
}
