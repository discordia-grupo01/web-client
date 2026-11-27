"use client";

import {
  BAN_NO_REASON,
  BAN_REVOKE_LABEL,
  type Ban,
} from "@discordia/client-shared";
import { useState } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { cn } from "@/lib/cn";
import { avatarSrcOf, displayNameOf } from "@/utils/userProfile";

interface BansTableProps {
  bans: Ban[];
  revokingUserId: string | null;
  onRevoke: (ban: Ban) => void;
}

interface BanReasonProps {
  reason: string | null;
  isExpanded: boolean;
  onToggle: () => void;
}

function BanReason({ reason, isExpanded, onToggle }: BanReasonProps) {
  if (!reason) {
    return <p className="text-content-muted text-xs italic">{BAN_NO_REASON}</p>;
  }
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isExpanded}
      className={cn(
        "text-content-muted hover:text-content block w-full cursor-pointer text-left text-xs italic transition-colors",
        isExpanded ? "break-words whitespace-pre-line" : "truncate",
      )}
    >
      {reason}
    </button>
  );
}

export function BansTable({ bans, revokingUserId, onRevoke }: BansTableProps) {
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  function reasonOf(ban: Ban) {
    return (
      <BanReason
        reason={ban.reason}
        isExpanded={expandedUserId === ban.user_id}
        onToggle={() =>
          setExpandedUserId((current) =>
            current === ban.user_id ? null : ban.user_id,
          )
        }
      />
    );
  }

  const columns: DataTableColumn<Ban>[] = [
    {
      header: "Usuario",
      cell: (ban) => {
        const name = displayNameOf(ban.profile);
        return (
          <div className="flex min-w-0 items-center gap-3">
            <Avatar
              name={name}
              src={avatarSrcOf(ban.user_id, ban.profile)}
              size={32}
              className="rounded-full"
            />
            <div className="min-w-0 flex-1">
              <p className="text-content truncate font-semibold">{name}</p>
              <div className="sm:hidden">{reasonOf(ban)}</div>
            </div>
          </div>
        );
      },
    },
    {
      header: "Motivo",
      className: "hidden sm:table-cell",
      cell: reasonOf,
    },
    {
      header: "Acción",
      className: "w-24 text-right sm:w-28",
      cell: (ban) => (
        <Button
          type="button"
          variant="secondary"
          onClick={() => onRevoke(ban)}
          isLoading={revokingUserId === ban.user_id}
          disabled={revokingUserId !== null}
          className="w-auto px-3 py-1.5 text-xs"
        >
          {BAN_REVOKE_LABEL}
        </Button>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={bans}
      rowKey={(ban) => ban.user_id}
      isHeaderHiddenOnMobile
    />
  );
}
