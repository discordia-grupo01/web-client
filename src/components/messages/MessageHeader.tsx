import {
  formatMessageTimestamp,
  hexToRgba,
  type MessageAuthor,
} from "@discordia/client-shared";

interface MessageHeaderProps {
  author: MessageAuthor;
  createdAt: string;
}

export function MessageHeader({ author, createdAt }: MessageHeaderProps) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span
        className="font-display text-content text-sm font-semibold"
        style={author.roleColor ? { color: author.roleColor } : undefined}
      >
        {author.name}
      </span>

      {author.roleName ? (
        <span
          className="text-sky rounded px-1 py-px text-[10px] font-semibold"
          style={
            author.roleColor
              ? {
                  color: author.roleColor,
                  background: hexToRgba(author.roleColor, 0.15),
                }
              : undefined
          }
        >
          {author.roleName}
        </span>
      ) : null}

      <time dateTime={createdAt} className="text-content-subtle text-[11px]">
        {formatMessageTimestamp(createdAt)}
      </time>
    </div>
  );
}
