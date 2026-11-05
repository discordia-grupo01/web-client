import { DiscordiaPointIcon } from "./DiscordiaIcons";

export function EmptyHistory({ text }: { text: string }) {
  return (
    <div className="border-line-strong bg-surface-raised rounded-2xl border border-dashed px-5 py-8 text-center">
      <DiscordiaPointIcon size={27} className="mx-auto" />
      <p className="text-content-muted mt-3 text-sm font-semibold">{text}</p>
    </div>
  );
}
