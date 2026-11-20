import {
  EMPTY_STATE_ICON_SIZE,
  SettingsEmptyState,
} from "@/components/ui/settings/SettingsEmptyState";

import { DiscordiaPointIcon } from "../icons/DiscordiaIcons";

export function EmptyHistory({ text }: { text: string }) {
  return (
    <SettingsEmptyState
      media={<DiscordiaPointIcon size={EMPTY_STATE_ICON_SIZE} />}
      text={text}
    />
  );
}
