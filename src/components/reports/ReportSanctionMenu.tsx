"use client";

import {
  BAN_ACTION_LABEL,
  DELETE_MESSAGE_LABEL,
  KICK_ACTION_LABEL,
  MUTE_ACTION_LABEL,
  REPORT_SANCTION_MENU_LABEL,
  type ReportSanction,
} from "@discordia/client-shared";
import {
  ChevronDown,
  Gavel,
  MicOff,
  Trash2,
  UserX,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const OPTIONS: { sanction: ReportSanction; label: string; icon: LucideIcon }[] =
  [
    { sanction: "delete", label: DELETE_MESSAGE_LABEL, icon: Trash2 },
    { sanction: "mute", label: MUTE_ACTION_LABEL, icon: MicOff },
    { sanction: "kick", label: KICK_ACTION_LABEL, icon: UserX },
    { sanction: "ban", label: BAN_ACTION_LABEL, icon: Gavel },
  ];

const MENU_WIDTH = 208;
const ITEM_HEIGHT = 40;
const GAP = 4;
const EDGE = 8;

interface ReportSanctionMenuProps {
  available: readonly ReportSanction[];
  onChoose: (sanction: ReportSanction) => void;
}

/**
 * El menu va en un portal con posicion fija: dentro de la configuracion (que
 * tiene scroll y recorta lo que sobresale) quedaba cortado. Se abre hacia
 * abajo y, si no entra, hacia arriba.
 */
export function ReportSanctionMenu({
  available,
  onChoose,
}: ReportSanctionMenuProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const options = OPTIONS.filter((option) =>
    available.includes(option.sanction),
  );
  const close = useCallback(() => setPosition(null), []);

  useEffect(() => {
    if (!position) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", close);
    window.addEventListener("blur", close);
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", close);
      window.removeEventListener("blur", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [position, close]);

  if (options.length === 0) return null;

  function open() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const height = options.length * ITEM_HEIGHT + 2 * GAP;
    const below = rect.bottom + GAP;
    const top =
      below + height <= window.innerHeight - EDGE
        ? below
        : Math.max(EDGE, rect.top - GAP - height);
    const left = Math.max(
      EDGE,
      Math.min(rect.left, window.innerWidth - MENU_WIDTH - EDGE),
    );
    setPosition({ left, top });
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (position ? close() : open())}
        aria-haspopup="menu"
        aria-expanded={position !== null}
        className="border-danger/40 text-danger hover:bg-danger/10 flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[13px] font-semibold transition-colors"
      >
        <Gavel size={14} aria-hidden="true" />
        {REPORT_SANCTION_MENU_LABEL}
        <ChevronDown size={14} aria-hidden="true" />
      </button>
      {position
        ? createPortal(
            <>
              <button
                type="button"
                aria-hidden
                tabIndex={-1}
                onClick={close}
                className="fixed inset-0 z-[60] cursor-default"
              />
              <div
                role="menu"
                aria-label={REPORT_SANCTION_MENU_LABEL}
                className="bg-surface-raised border-line fixed z-[61] overflow-hidden rounded-xl border py-1 shadow-2xl"
                style={{ ...position, width: MENU_WIDTH }}
              >
                {options.map(({ sanction, label, icon: Icon }) => (
                  <button
                    key={sanction}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      close();
                      onChoose(sanction);
                    }}
                    className="text-danger hover:bg-danger/10 flex h-10 w-full cursor-pointer items-center gap-2.5 px-3.5 text-left text-[13px] font-semibold transition-colors"
                  >
                    <Icon size={14} aria-hidden="true" />
                    {label}
                  </button>
                ))}
              </div>
            </>,
            document.body,
          )
        : null}
    </>
  );
}
