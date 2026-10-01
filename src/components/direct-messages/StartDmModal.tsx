"use client";

import {
  NEW_DIRECT_MESSAGE_LABEL,
  type MessageAuthor,
} from "@discordia/client-shared";

import { Search } from "lucide-react";
import { useState } from "react";

import { ModalShell } from "@/components/ui/ModalShell";
import { ServerAvatar } from "@/components/ui/ServerAvatar";

interface StartDmModalProps {
  partners: MessageAuthor[];
  onClose: () => void;
  onStart: (partnerId: string) => void;
}

const TITLE_ID = "start-dm-modal-title";

export function StartDmModal({
  partners,
  onClose,
  onStart,
}: StartDmModalProps) {
  const [query, setQuery] = useState("");
  const filtered = partners.filter((partner) =>
    partner.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <ModalShell onClose={onClose} maxWidth={380} labelledBy={TITLE_ID}>
      <div className="border-line border-b px-5 pt-6 pb-4">
        <h2
          id={TITLE_ID}
          className="font-display text-content text-lg font-bold"
        >
          {NEW_DIRECT_MESSAGE_LABEL}
        </h2>
        <div className="bg-surface-input border-line mt-3 flex items-center gap-2 rounded-lg border px-3 py-2">
          <Search size={14} className="text-content-subtle shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre..."
            className="text-content placeholder:text-content-subtle w-full bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto p-2">
        {filtered.length === 0 ? (
          <p className="text-content-subtle px-3 py-4 text-center text-sm">
            Sin resultados
          </p>
        ) : (
          filtered.map((partner) => (
            <button
              key={partner.id}
              type="button"
              onClick={() => onStart(partner.id)}
              className="hover:bg-surface-hover flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-left transition-colors"
            >
              <ServerAvatar
                name={partner.name}
                src={partner.avatarUrl}
                size={32}
                className="rounded-full"
              />
              <span className="text-content truncate text-sm font-medium">
                {partner.name}
              </span>
            </button>
          ))
        )}
      </div>
    </ModalShell>
  );
}
