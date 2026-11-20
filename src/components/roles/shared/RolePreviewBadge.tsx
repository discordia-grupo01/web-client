import { hexToRgba, isValidHex } from "@discordia/client-shared";

/** Como se va a ver el rol; debajo del nombre para que uno largo no tape el input. */
export function RolePreviewBadge({
  name,
  color,
}: {
  name: string;
  color: string;
}) {
  if (!isValidHex(color)) return null;
  return (
    <span
      className="flex w-fit max-w-full min-w-0 items-center gap-1.5 rounded-full border px-2.5 py-1"
      style={{
        borderColor: hexToRgba(color, 0.4),
        backgroundColor: hexToRgba(color, 0.12),
      }}
    >
      <span
        className="size-2 shrink-0 rounded-sm"
        style={{ backgroundColor: color }}
      />
      <span className="truncate text-xs font-bold" style={{ color }}>
        {name.trim() || "Rol"}
      </span>
    </span>
  );
}
