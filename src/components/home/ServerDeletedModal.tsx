"use client";

import {
  SERVER_DELETED_NOTICE_ACTION,
  SERVER_DELETED_NOTICE_TITLE,
  serverDeletedNoticeDescription,
} from "@discordia/client-shared";
import { Trash2 } from "lucide-react";

import { useStaffNotices } from "@/components/home/hooks/useStaffNotices";
import { Button } from "@/components/ui/Button";
import { ModalShell } from "@/components/ui/ModalShell";

export function ServerDeletedModal() {
  const { notice, dismiss } = useStaffNotices();

  if (!notice) return null;

  const close = () => dismiss(notice.id);

  return (
    <ModalShell
      onClose={close}
      maxWidth={380}
      labelledBy="server-deleted-title"
      hasCloseButton={false}
    >
      <div className="flex flex-col items-center gap-5 px-7 py-8 text-center">
        <div className="bg-danger/15 text-danger flex size-16 shrink-0 items-center justify-center rounded-2xl">
          <Trash2 size={30} />
        </div>

        <div>
          <h2
            id="server-deleted-title"
            className="font-display text-content mb-2 text-xl font-bold"
          >
            {SERVER_DELETED_NOTICE_TITLE}
          </h2>
          <p className="text-content-muted text-sm leading-relaxed">
            {serverDeletedNoticeDescription(notice.server_name)}
          </p>
        </div>

        <Button onClick={close} autoFocus>
          {SERVER_DELETED_NOTICE_ACTION}
        </Button>
      </div>
    </ModalShell>
  );
}
