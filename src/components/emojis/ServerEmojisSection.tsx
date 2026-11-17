"use client";

import {
  EMOJI_DELETE_COPY,
  EMOJI_SLOTS_FULL_COPY,
  EMOJI_UPLOAD_COPY,
  EMOJIS_READ_ONLY_NOTICE,
  EMOJIS_SECTION_TITLE,
  EMOJIS_SECTION_DESCRIPTION,
  emojiDeleteTitle,
  emojiLabel,
  emojisSectionTitleFor,
  hasEmojiSlots,
  MEMBER_PAGE_LIMIT,
  serverBoostCount,
  serverBoostLevel,
  type ServerEmoji,
  type ServerSummary,
} from "@discordia/client-shared";
import { Info, Plus, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";

import { useOwnPremium } from "@/contexts/OwnProfileContext";

import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FormAlert } from "@/components/ui/FormAlert";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { deleteServerEmojiRequest } from "@/services/emojis/client";
import { listMembersRequest } from "@/services/members/client";
import { emojiImageSrc } from "@/utils/image-urls";

import { EmojiCapacityCard } from "./EmojiCapacityCard";
import { ServerEmojiList } from "./ServerEmojiList";
import { UploadEmojiModal } from "./UploadEmojiModal";
import { useServerEmojis } from "./hooks/useServerEmojis";

interface ServerEmojisSectionProps {
  server: ServerSummary;
  canManageServer: boolean;
  titleId: string;
}

export function ServerEmojisSection({
  server,
  canManageServer,
  titleId,
}: ServerEmojisSectionProps) {
  const { page, error, reload, addEmoji, removeEmoji } = useServerEmojis(
    server.id,
  );
  const isPremium = useOwnPremium();
  const [authorNames, setAuthorNames] = useState<Record<string, string> | null>(
    null,
  );
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [emojiToDelete, setEmojiToDelete] = useState<ServerEmoji | null>(null);
  const [deleteError, setDeleteError] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    listMembersRequest(server.id, { limit: MEMBER_PAGE_LIMIT }).then(
      (result) => {
        if (cancelled || !result.ok) return;
        setAuthorNames(
          Object.fromEntries(
            result.members.flatMap((member) => {
              const name = member.profile?.name;
              return name ? [[member.user_id, name] as const] : [];
            }),
          ),
        );
      },
    );
    return () => {
      cancelled = true;
    };
  }, [server.id]);

  async function handleDelete(emoji: ServerEmoji) {
    setEmojiToDelete(null);
    setDeleteError(undefined);
    const result = await deleteServerEmojiRequest(server.id, emoji.id);
    if (!result.ok) {
      setDeleteError(result.message);
      void reload();
      return;
    }
    removeEmoji(emoji.id);
  }

  const isFull = page !== null && !hasEmojiSlots(page);

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="px-4 pt-6 pb-2 sm:px-7 sm:pt-8">
        <h2
          id={titleId}
          className="font-display text-content mb-1 pr-12 text-xl font-bold"
        >
          {emojisSectionTitleFor(server.name)}
        </h2>
        <p className="text-content-muted text-sm leading-relaxed">
          {EMOJIS_SECTION_DESCRIPTION}
        </p>
      </div>

      <div className="flex-1 space-y-5 px-4 py-6 sm:px-7">
        <FormAlert message={error ?? deleteError} />

        {page === null && !error ? (
          <p className="text-content-subtle text-sm">Cargando…</p>
        ) : null}

        {page !== null ? (
          <>
            <EmojiCapacityCard
              serverName={server.name}
              used={page.emojis.length}
              max={page.max_emojis}
              level={serverBoostLevel(server)}
              boostCount={serverBoostCount(server)}
            />

            {canManageServer && isFull ? (
              <div className="border-boost-warn-line bg-boost-warn-soft flex items-start gap-3 rounded-xl border px-3.5 py-3">
                <TriangleAlert
                  size={16}
                  className="text-warning mt-0.5 shrink-0"
                />
                <p className="text-content text-sm leading-relaxed">
                  <span className="font-semibold">
                    {EMOJI_SLOTS_FULL_COPY.title}
                  </span>{" "}
                  <span className="text-content-muted">
                    {EMOJI_SLOTS_FULL_COPY.detail}
                  </span>
                </p>
              </div>
            ) : null}

            {canManageServer ? null : (
              <div className="bg-surface-input border-line flex items-start gap-3 rounded-xl border px-3.5 py-3">
                <Info size={16} className="text-info mt-0.5 shrink-0" />
                <p className="text-content-muted text-sm leading-relaxed">
                  {EMOJIS_READ_ONLY_NOTICE}
                </p>
              </div>
            )}

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <SectionLabel>{EMOJIS_SECTION_TITLE}</SectionLabel>
                  <span className="text-content-subtle text-xs tabular-nums">
                    {page.emojis.length}
                  </span>
                </div>
                {canManageServer ? (
                  <Button
                    type="button"
                    className="w-auto shrink-0 px-3.5 py-2"
                    disabled={isFull}
                    onClick={() => setIsUploadOpen(true)}
                  >
                    <Plus size={16} />
                    {EMOJI_UPLOAD_COPY.submit}
                  </Button>
                ) : null}
              </div>
              <ServerEmojiList
                emojis={page.emojis}
                authorNames={authorNames}
                canManage={canManageServer}
                isPremium={isPremium}
                onDelete={setEmojiToDelete}
              />
            </div>
          </>
        ) : null}
      </div>

      {isUploadOpen ? (
        <UploadEmojiModal
          serverId={server.id}
          onClose={() => setIsUploadOpen(false)}
          onUploaded={(emoji) => {
            addEmoji(emoji);
            setIsUploadOpen(false);
          }}
        />
      ) : null}

      {emojiToDelete ? (
        <ConfirmDialog
          media={
            /* eslint-disable-next-line @next/next/no-img-element -- el host de la imagen lo decide el back */
            <img
              src={emojiImageSrc(emojiToDelete.image_url)}
              alt={emojiLabel(emojiToDelete.name)}
              className="size-10 object-contain"
            />
          }
          title={emojiDeleteTitle(emojiToDelete.name)}
          body={EMOJI_DELETE_COPY.detail}
          confirmLabel={EMOJI_DELETE_COPY.confirm}
          cancelLabel={EMOJI_DELETE_COPY.cancel}
          onConfirm={() => void handleDelete(emojiToDelete)}
          onCancel={() => setEmojiToDelete(null)}
        />
      ) : null}
    </div>
  );
}
