"use client";

import type { User } from "@discordia/client-shared";

import { Home as HomeIcon } from "lucide-react";

import { EmptyState } from "@/components/home/empty-state";
import { MobileNavButton } from "@/components/layout/mobile-nav-button";
import { useMobilePanels } from "@/components/layout/mobile-panels-context";
import { SidePanel } from "@/components/layout/side-panel";
import { UserPanel } from "@/components/profile/user-panel";

interface HomeViewProps {
  hasServers: boolean;
  userName?: string;
  ownProfile: User | null;
  onOpenOwnProfile: () => void;
  onCreateClick: () => void;
  onJoinClick: () => void;
}

export function HomeView({
  hasServers,
  userName,
  ownProfile,
  onOpenOwnProfile,
  onCreateClick,
  onJoinClick,
}: HomeViewProps) {
  const { openPanel } = useMobilePanels();

  return (
    <div className="flex flex-1 overflow-hidden">
      <SidePanel position="afterRail" isOpen={openPanel === "nav"}>
        <div
          className="flex w-60 shrink-0 flex-col overflow-hidden"
          style={{ background: "var(--bg-channels)" }}
        >
          <div className="border-line flex h-12 shrink-0 items-center gap-2 border-b px-4">
            <HomeIcon size={16} className="text-content-subtle" />
            <span className="font-display text-content text-sm font-semibold">
              Inicio
            </span>
          </div>

          <div className="flex-1" />

          {ownProfile ? (
            <UserPanel user={ownProfile} onClick={onOpenOwnProfile} />
          ) : null}
        </div>
      </SidePanel>

      <div
        className="flex min-w-0 flex-1 flex-col overflow-hidden"
        style={{ background: "var(--bg-chat)" }}
      >
        <div className="border-line flex h-12 shrink-0 items-center gap-1 border-b px-2 md:hidden">
          <MobileNavButton />
          <span className="font-display text-content text-sm font-semibold">
            Inicio
          </span>
        </div>

        {hasServers ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="font-display text-content-subtle text-sm font-semibold tracking-wider uppercase">
              Tus servidores
            </p>
            <h1 className="font-display text-content text-2xl font-bold">
              Elegí un servidor de la barra lateral
            </h1>
          </div>
        ) : (
          <EmptyState
            userName={userName}
            onCreateClick={onCreateClick}
            onJoinClick={onJoinClick}
          />
        )}
      </div>
    </div>
  );
}
