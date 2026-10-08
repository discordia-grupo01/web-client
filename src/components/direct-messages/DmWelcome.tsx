import {
  dmConversationStart,
  type MessageAuthor,
} from "@discordia/client-shared";

import { ServerAvatar } from "@/components/ui/ServerAvatar";

/** Comienzo del historial de una conversacion directa. */
export function DmWelcome({ partner }: { partner: MessageAuthor }) {
  return (
    <div className="mb-6 flex flex-col items-start px-2">
      <ServerAvatar
        name={partner.name}
        src={partner.avatarUrl}
        size={56}
        className="mb-3 rounded-full"
      />
      <h2 className="font-display text-content mb-1 text-xl font-bold">
        {partner.name}
      </h2>
      <p className="text-content-muted text-sm">
        {dmConversationStart(partner.name)}
      </p>
    </div>
  );
}
