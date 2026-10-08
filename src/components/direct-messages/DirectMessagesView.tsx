"use client";

import type {
  MessageAuthor,
  ServerSummary,
  User,
} from "@discordia/client-shared";

import { useState } from "react";

import { useMobilePanels } from "@/components/layout/MobilePanelsContext";
import { SidePanel } from "@/components/layout/SidePanel";
import { PublicProfileModal } from "@/components/profile/PublicProfileModal";
import { useDmCandidates } from "@/services/conversations/useDmCandidates";
import type { useDirectMessages } from "@/services/conversations/useDirectMessages";

import { DmConversation } from "./DmConversation";
import { DmRailList } from "./DmRailList";
import { StartDmModal } from "./StartDmModal";

interface DirectMessagesViewProps {
  currentAuthor: MessageAuthor | null;
  ownProfile: User | null;
  onOpenOwnProfile: () => void;
  servers: ServerSummary[];
  directMessages: ReturnType<typeof useDirectMessages>;
}

/** Puramente presentacional: el estado de los DMs vive en `HomeShell` (`useDirectMessages`), para que sobreviva a cambiar de vista. */
export function DirectMessagesView({
  currentAuthor,
  ownProfile,
  onOpenOwnProfile,
  servers,
  directMessages,
}: DirectMessagesViewProps) {
  const { openPanel, close: closeMobilePanel } = useMobilePanels();
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const { conversations, activeSummary, openConversation, sendMessage } =
    directMessages;
  const { candidates, isLoading: isLoadingCandidates } = useDmCandidates(
    servers,
    currentAuthor?.id ?? null,
    isStartModalOpen,
  );

  return (
    <div className="flex min-w-0 flex-1 overflow-hidden">
      <SidePanel position="afterRail" isOpen={openPanel === "nav"}>
        <DmRailList
          conversations={conversations}
          activePartnerId={activeSummary?.partner.id ?? null}
          onSelect={(id) => {
            openConversation(id);
            closeMobilePanel();
          }}
          onStartNew={() => setIsStartModalOpen(true)}
          ownProfile={ownProfile}
          onOpenOwnProfile={onOpenOwnProfile}
        />
      </SidePanel>

      {currentAuthor ? (
        <DmConversation
          currentAuthor={currentAuthor}
          activeSummary={activeSummary}
          onSend={sendMessage}
          onOpenPartnerProfile={setProfileUserId}
        />
      ) : null}

      {profileUserId ? (
        <PublicProfileModal
          userId={profileUserId}
          canBlock
          onClose={() => setProfileUserId(null)}
        />
      ) : null}

      {isStartModalOpen ? (
        <StartDmModal
          partners={candidates}
          isLoading={isLoadingCandidates}
          onClose={() => setIsStartModalOpen(false)}
          onStart={(partner) => {
            openConversation(partner.id, partner);
            setIsStartModalOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}
