"use client";

import {
  MENTION_EVERYONE_HINT,
  MENTION_ROLE_HINT,
  MENTION_SECTION_EVERYONE,
  MENTION_SECTION_MEMBERS,
  MENTION_SECTION_ROLES,
  type MentionCandidate,
  mentionMembersMatchTitle,
} from "@discordia/client-shared";

import { Fragment } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";

interface MentionSuggestionsProps {
  /** Texto escrito despues de la `@`; con texto el titulo de miembros pasa a "que coinciden con". */
  query: string;
  candidates: readonly MentionCandidate[];
  selectedIndex: number;
  onPick: (candidate: MentionCandidate) => void;
  /** `id` del `listbox`, para `aria-controls` del textarea. */
  id: string;
  /** Margenes laterales segun donde se ancle (por defecto, al ancho del contenedor). */
  className?: string;
}

function sectionTitle(kind: MentionCandidate["kind"], query: string): string {
  if (kind === "role") return MENTION_SECTION_ROLES;
  if (kind === "everyone") return MENTION_SECTION_EVERYONE;
  return query ? mentionMembersMatchTitle(query) : MENTION_SECTION_MEMBERS;
}

/** Lista que aparece sobre el cuadro de texto al escribir `@`. */
export function MentionSuggestions({
  query,
  candidates,
  selectedIndex,
  onPick,
  id,
  className,
}: MentionSuggestionsProps) {
  return (
    <div
      id={id}
      role="listbox"
      className={cn(
        "bg-surface-raised border-line absolute inset-x-0 bottom-full z-30 mb-2 max-h-72 overflow-y-auto rounded-lg border p-1.5 shadow-2xl",
        className,
      )}
    >
      {candidates.map((candidate, index) => (
        <Fragment
          key={`${candidate.kind}:${"id" in candidate ? candidate.id : "everyone"}`}
        >
          {index === 0 || candidates[index - 1].kind !== candidate.kind ? (
            <p className="text-content-subtle px-2 pt-2 pb-1 text-[11px] font-semibold tracking-wide uppercase">
              {sectionTitle(candidate.kind, query)}
            </p>
          ) : null}
          <button
            type="button"
            role="option"
            aria-selected={index === selectedIndex}
            // El clic no le saca el foco al textarea.
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onPick(candidate)}
            className={cn(
              "flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm",
              index === selectedIndex
                ? "bg-surface-hover"
                : "hover:bg-surface-hover",
            )}
          >
            <CandidateRow candidate={candidate} />
          </button>
        </Fragment>
      ))}
    </div>
  );
}

function CandidateRow({ candidate }: { candidate: MentionCandidate }) {
  if (candidate.kind === "user") {
    return (
      <>
        <Avatar
          name={candidate.name}
          src={candidate.avatarUrl}
          size={24}
          className="rounded-full"
        />
        <span className="text-content truncate">{candidate.name}</span>
      </>
    );
  }

  if (candidate.kind === "role") {
    return (
      <>
        <span
          className="truncate font-medium"
          style={{ color: candidate.color }}
        >
          @{candidate.name}
        </span>
        <span className="text-content-subtle ml-auto hidden truncate text-xs md:block">
          {MENTION_ROLE_HINT}
        </span>
      </>
    );
  }

  return (
    <>
      <span className="text-highlight font-semibold">@everyone</span>
      <span className="text-content-subtle ml-auto hidden truncate text-xs md:block">
        {MENTION_EVERYONE_HINT}
      </span>
    </>
  );
}
