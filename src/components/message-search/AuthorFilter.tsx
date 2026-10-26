"use client";

import {
  displayNameOf,
  type Member,
  MESSAGE_SEARCH_ANY_AUTHOR,
  MESSAGE_SEARCH_AUTHOR_LABEL,
  MESSAGE_SEARCH_AUTHOR_PLACEHOLDER,
  MESSAGE_SEARCH_CLEAR_AUTHOR,
  MESSAGE_SEARCH_NO_MEMBERS,
} from "@discordia/client-shared";
import { User, X } from "lucide-react";
import { useMemo } from "react";

import { SearchableSelect } from "@/components/ui/SearchableSelect";

interface AuthorFilterProps {
  members: Member[] | null;
  authorId: string | null;
  /** Nombre a mostrar si el autor elegido ya no esta en la lista. */
  fallbackName?: string;
  onChange: (authorId: string | null) => void;
}

export function AuthorFilter({
  members,
  authorId,
  fallbackName,
  onChange,
}: AuthorFilterProps) {
  const options = useMemo(
    () =>
      (members ?? [])
        .map((member) => ({
          id: member.user_id,
          label: displayNameOf(member.profile),
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [members],
  );
  const selected = options.find((option) => option.id === authorId);
  const authorName = authorId
    ? (selected?.label ?? fallbackName ?? MESSAGE_SEARCH_ANY_AUTHOR)
    : MESSAGE_SEARCH_ANY_AUTHOR;

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-content-subtle text-xs font-semibold">
        {MESSAGE_SEARCH_AUTHOR_LABEL}:
      </span>
      <SearchableSelect
        options={options}
        onSelect={onChange}
        triggerLabel={authorName}
        triggerIcon={<User size={12} aria-hidden="true" />}
        searchPlaceholder={MESSAGE_SEARCH_AUTHOR_PLACEHOLDER}
        noResultsMessage={MESSAGE_SEARCH_NO_MEMBERS}
        className="max-w-48 truncate"
      />
      {authorId ? (
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label={MESSAGE_SEARCH_CLEAR_AUTHOR}
          className="text-content-subtle hover:text-content flex size-6 cursor-pointer items-center justify-center rounded-md"
        >
          <X size={13} />
        </button>
      ) : null}
    </div>
  );
}
