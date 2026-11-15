import {
  BOOST_SHOWCASE_ART_COPY as ART_COPY,
  type BoostPerk,
  type ServerSummary,
  vanitySlug,
} from "@discordia/client-shared";
import { Link2, Smile } from "lucide-react";

import { Avatar } from "@/components/ui/Avatar";
import { serverIconSrc } from "@/utils/image-urls";

import { BoostLevelIcon } from "../icons/BoostLevelIcon";

const EMOJI_TILES = [
  "bg-accent text-boost-paper",
  "bg-info text-boost-ink",
  "bg-sky text-boost-ink",
  "bg-boost-paper text-accent",
];

interface BoostShowcaseArtProps {
  perk: BoostPerk;
  server: ServerSummary;
}

export function BoostShowcaseArt({ perk, server }: BoostShowcaseArtProps) {
  return (
    <div
      aria-hidden="true"
      className="bg-surface-sunken flex h-24 items-center justify-center gap-2.5 overflow-hidden rounded-xl p-3"
    >
      <Art perk={perk} server={server} />
    </div>
  );
}

function Art({ perk, server }: BoostShowcaseArtProps) {
  switch (perk) {
    case "extra_emoji_slots":
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
          <span className="bg-boost-yellow text-boost-ink flex h-8.5 items-center rounded-[10px] px-2.5 text-xs font-bold">
            {ART_COPY.extraEmojiSlots}
          </span>
        </>
      );
    case "animated_icon":
      return (
        <>
          <span className="flex flex-col items-center gap-1.5">
            <span className="bg-surface-input size-6.5 rounded-lg" />
            <Avatar
              name={server.name}
              src={serverIconSrc(server)}
              size={36}
              className="ring-boost-yellow ring-offset-surface-sunken rounded-xl ring-2 ring-offset-2"
            />
            <span className="bg-surface-input size-6.5 rounded-lg" />
          </span>
          <span className="flex flex-col gap-1">
            <span className="text-content text-[11px] font-bold">
              {ART_COPY.serverList}
            </span>
            <span className="text-content-muted text-[10px]">
              {ART_COPY.animatedIconHint}
            </span>
          </span>
        </>
      );
    case "custom_banner":
      return (
        <span className="border-line flex h-18 w-full flex-col overflow-hidden rounded-[10px] border">
          <span className="bg-accent flex h-8.5 items-end gap-2 px-2.5 pb-1.5">
            <span className="text-boost-paper truncate text-[11px] font-bold">
              {server.name}
            </span>
            <span className="ml-auto flex items-end gap-0.75">
              <span className="bg-info h-3 w-2 rounded-sm" />
              <span className="bg-sky h-4.5 w-2 rounded-sm" />
              <span className="bg-boost-yellow h-2 w-2 rounded-sm" />
            </span>
          </span>
          <span className="bg-surface-raised flex flex-1 flex-col gap-1.5 px-2.5 py-2">
            <span className="bg-line-strong h-1.25 w-3/5 rounded-sm" />
            <span className="bg-line h-1.25 w-2/5 rounded-sm" />
          </span>
        </span>
      );
    case "larger_attachments":
      return (
        <>
          <span className="bg-info text-boost-ink flex h-12.5 w-10.5 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold">
            {ART_COPY.attachmentKind}
          </span>
          <span className="flex flex-1 flex-col gap-1.5">
            <span className="text-content text-[11px] font-semibold">
              {ART_COPY.attachmentName}
            </span>
            <span className="bg-surface-input h-1.25 overflow-hidden rounded-sm">
              <span className="bg-info block h-full w-4/5" />
            </span>
            <span className="text-content-muted text-[10px]">
              {ART_COPY.attachmentUsed}{" "}
              <strong className="text-content">
                {ART_COPY.attachmentLimit}
              </strong>
            </span>
          </span>
        </>
      );
    case "vanity_url":
      return (
        <span className="flex w-full flex-col gap-1.5">
          <span className="text-content-subtle text-[10px] font-bold tracking-wider uppercase">
            {ART_COPY.invite}
          </span>
          <span className="bg-surface-raised border-line-strong flex min-w-0 items-center gap-2 rounded-[10px] border px-2.5 py-2">
            <Link2 size={14} className="text-content-muted shrink-0" />
            <span className="text-content-muted truncate text-xs">
              {ART_COPY.invitePath}
              <strong className="text-boost-yellow">
                {vanitySlug(server.name)}
              </strong>
            </span>
          </span>
        </span>
      );
    case "boosted_badge":
      return (
        <>
          <Avatar
            name={server.name}
            src={serverIconSrc(server)}
            size={44}
            className="shrink-0 rounded-full"
          />
          <span className="flex min-w-0 flex-col gap-1.5">
            <span className="text-content truncate text-xs font-bold">
              {server.name}
            </span>
            <span className="bg-boost-paper text-boost-ink inline-flex items-center gap-1.5 self-start rounded-full px-2 py-0.75 text-[10px] font-bold">
              <BoostLevelIcon level={3} size={13} bare />
              {ART_COPY.badge}
            </span>
          </span>
        </>
      );
  }
}
