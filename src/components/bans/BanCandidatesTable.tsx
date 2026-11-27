import { BAN_ACTION_LABEL, type Member } from "@discordia/client-shared";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { avatarSrcOf, displayNameOf } from "@/utils/userProfile";

import { type BanTarget } from "./BanMemberModal";

interface BanCandidatesTableProps {
  members: Member[];
  onOpenProfile: (userId: string) => void;
  onBan: (target: BanTarget) => void;
}

function targetOf(member: Member): BanTarget {
  return {
    userId: member.user_id,
    name: displayNameOf(member.profile),
    avatarSrc: avatarSrcOf(member.user_id, member.profile),
  };
}

export function BanCandidatesTable({
  members,
  onOpenProfile,
  onBan,
}: BanCandidatesTableProps) {
  const columns: DataTableColumn<Member>[] = [
    {
      header: "Usuario",
      cell: (member) => {
        const { name, avatarSrc } = targetOf(member);
        return (
          <button
            type="button"
            onClick={() => onOpenProfile(member.user_id)}
            aria-label={`Ver perfil de ${name}`}
            className="flex max-w-full min-w-0 cursor-pointer items-center gap-3 text-left hover:opacity-80"
          >
            <Avatar
              name={name}
              src={avatarSrc}
              size={32}
              className="rounded-full"
            />
            <span className="text-content truncate font-semibold">{name}</span>
          </button>
        );
      },
    },
    {
      header: "Acción",
      className: "w-28 text-right",
      cell: (member) => (
        <Button
          type="button"
          variant="secondary"
          onClick={() => onBan(targetOf(member))}
          className="text-danger w-auto px-3 py-1.5 text-xs"
        >
          {BAN_ACTION_LABEL}
        </Button>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={members}
      rowKey={(member) => member.user_id}
      isHeaderHiddenOnMobile
    />
  );
}
