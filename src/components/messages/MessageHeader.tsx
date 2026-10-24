import {
  formatMessageTimestamp,
  type MessageAuthor,
} from "@discordia/client-shared";

interface MessageHeaderProps {
  author: MessageAuthor;
  createdAt: string;
  onOpenProfile?: () => void;
}

export function MessageHeader({
  author,
  createdAt,
  onOpenProfile,
}: MessageHeaderProps) {
  const nameClassName = "font-display text-content text-sm font-semibold";
  const nameStyle = author.roleColor ? { color: author.roleColor } : undefined;

  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      {onOpenProfile ? (
        <button
          type="button"
          onClick={onOpenProfile}
          className={`${nameClassName} cursor-pointer underline-offset-2 hover:underline`}
          style={nameStyle}
        >
          {author.name}
        </button>
      ) : (
        <span className={nameClassName} style={nameStyle}>
          {author.name}
        </span>
      )}

      <time dateTime={createdAt} className="text-content-subtle text-[11px]">
        {formatMessageTimestamp(createdAt)}
      </time>
    </div>
  );
}
