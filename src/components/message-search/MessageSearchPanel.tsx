"use client";

import {
  type Channel,
  MESSAGE_SEARCH_CLOSE,
  MESSAGE_SEARCH_TITLE,
  type MessageAuthor,
  messageSearchResultsCount,
  type Role,
  unknownAuthor,
} from "@discordia/client-shared";
import { X } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";

import { MessageMentionsProvider } from "@/contexts/MentionsContext";
import { useMessageAuthors } from "@/hooks/useMessageAuthors";
import { useMessageMentionsValue } from "@/hooks/useMessageMentionsValue";
import { useServerMembers } from "@/hooks/useServerMembers";
import { FieldError } from "@/components/ui/FieldError";
import { IconButton } from "@/components/ui/IconButton";
import { Pagination } from "@/components/ui/Pagination";

import { AuthorFilter } from "./AuthorFilter";
import { useMessageSearchContext } from "@/contexts/MessageSearchContext";
import { MessageSearchInput } from "./MessageSearchInput";
import { MessageSearchResult } from "./MessageSearchResult";
import {
  MessageSearchEmpty,
  MessageSearchError,
  MessageSearchHint,
  MessageSearchSkeleton,
} from "./MessageSearchStatus";

interface MessageSearchPanelProps {
  channels: Channel[];
  currentAuthor: MessageAuthor | null;
  serverRoles: Role[];
  myRoleIds: string[];
}

/** Panel derecho con el filtro de autor, los resultados y el paginador. */
export function MessageSearchPanel({
  channels,
  currentAuthor,
  serverRoles,
  myRoleIds,
}: MessageSearchPanelProps) {
  const {
    serverId,
    close,
    authorId,
    setAuthorId,
    validationError,
    search,
    openResult,
  } = useMessageSearchContext();
  const { state, results, pageCount, isEmpty, goToPage, retry } = search;

  const members = useServerMembers(serverId);
  const authors = useMessageAuthors(
    members,
    results,
    currentAuthor,
    serverRoles,
  );
  const mentions = useMessageMentionsValue({
    members,
    authors,
    serverRoles,
    canMentionEveryone: false,
    currentUserId: currentAuthor?.id ?? null,
    myRoleIds,
  });
  const channelNames = useMemo(
    () => new Map(channels.map((channel) => [channel.id, channel.name])),
    [channels],
  );

  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    listRef.current?.scrollTo({ top: 0 });
  }, [state.page, state.searchId]);

  const term = state.query?.text ?? "";
  const showPagination =
    state.query !== null && !isEmpty && pageCount > 1 && state.pages.length > 0;

  let body;
  if (state.status === "idle") {
    body = <MessageSearchHint />;
  } else if (state.status === "loading") {
    body = <MessageSearchSkeleton />;
  } else if (state.status === "error") {
    body = <MessageSearchError message={state.error ?? ""} onRetry={retry} />;
  } else if (isEmpty) {
    body = <MessageSearchEmpty />;
  } else {
    body = (
      <ul className="space-y-2">
        {results.map((message) => (
          <li key={message.id}>
            <MessageSearchResult
              message={message}
              author={
                authors[message.user_id] ?? unknownAuthor(message.user_id)
              }
              channelName={channelNames.get(message.channel_id) ?? "…"}
              term={term}
              onOpen={() => openResult(message)}
            />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <aside
      aria-label={MESSAGE_SEARCH_TITLE}
      className="border-line flex h-full w-[min(88vw,380px)] shrink-0 flex-col border-l md:w-[340px] lg:w-[400px]"
      style={{ background: "var(--bg-channels)" }}
    >
      {/* En pantallas anchas el campo esta en el header, justo arriba. */}
      <header className="border-line flex h-12 shrink-0 items-center gap-1 border-b pr-1.5 pl-3 lg:hidden">
        <MessageSearchInput />
        <IconButton icon={X} label={MESSAGE_SEARCH_CLOSE} onClick={close} />
      </header>

      <div className="border-line shrink-0 border-b px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <AuthorFilter
            members={members}
            authorId={authorId}
            fallbackName={authorId ? authors[authorId]?.name : undefined}
            onChange={setAuthorId}
          />
          {state.total !== null && !isEmpty ? (
            <span className="text-content-muted shrink-0 text-xs whitespace-nowrap">
              {messageSearchResultsCount(state.total, state.totalCapped)}
            </span>
          ) : null}
        </div>
        <FieldError message={validationError ?? undefined} />
      </div>

      <MessageMentionsProvider value={mentions}>
        <div
          ref={listRef}
          aria-live="polite"
          aria-busy={state.status === "loading"}
          className="flex-1 overflow-y-auto p-3"
        >
          {body}
        </div>
      </MessageMentionsProvider>

      {showPagination ? (
        <footer className="border-line flex shrink-0 justify-center border-t p-2">
          <Pagination
            page={state.status === "loading" ? state.targetPage : state.page}
            pageCount={pageCount}
            onPageChange={goToPage}
            isCompact
          />
        </footer>
      ) : null}
    </aside>
  );
}
