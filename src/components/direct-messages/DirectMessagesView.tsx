"use client";

import type {
  MessageAuthor,
  ServerSummary,
  User,
} from "@discordia/client-shared";

import { useEffect, useState } from "react";

import { useMobilePanels } from "@/contexts/MobilePanelsContext";
import { SidePanel } from "@/components/layout/SidePanel";
import { PublicProfileModal } from "@/components/profile/PublicProfileModal";
import { useDmCandidates } from "@/components/direct-messages/hooks/useDmCandidates";
import type { useDirectMessages } from "@/hooks/useDirectMessages";

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
  const {
    conversations,
    isLoading,
    loadError,
    activeSummary,
    openConversation,
    sendMessage,
    isConnected,
    retry,
  } = directMessages;
  const isListDocked = !activeSummary;

  // Con la lista fija no hay drawer: si venia abierto, su backdrop la taparia.
  useEffect(() => {
    if (isListDocked && openPanel === "nav") closeMobilePanel();
  }, [isListDocked, openPanel, closeMobilePanel]);

  const { candidates, isLoading: isLoadingCandidates } = useDmCandidates(
    servers,
    currentAuthor?.id ?? null,
    isStartModalOpen,
  );

  return (
    <div className="flex min-w-0 flex-1 overflow-hidden">
      {/* Sin conversacion abierta, en mobile la lista ocupa la pantalla en vez
        de dejar un estado vacio detras del drawer. */}
      <SidePanel
        position="afterRail"
        isOpen={openPanel === "nav"}
        isDocked={isListDocked}
        className={isListDocked ? "flex-1 md:flex-none" : undefined}
      >
        <DmRailList
          className={isListDocked ? "w-full md:w-60" : undefined}
          conversations={conversations}
          isLoading={isLoading}
          loadError={loadError}
          isOffline={loadError !== null && !isConnected}
          onRetryLoad={retry}
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
          isConnected={isConnected}
          isOffline={loadError !== null && !isConnected}
          onRetryLoad={retry}
          onOpenPartnerProfile={setProfileUserId}
          onOpenProfile={(userId) =>
            userId === currentAuthor.id
              ? onOpenOwnProfile()
              : setProfileUserId(userId)
          }
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
