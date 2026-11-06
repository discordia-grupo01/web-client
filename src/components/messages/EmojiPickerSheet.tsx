"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import { BottomSheet } from "@/components/ui/BottomSheet";

const EmojiPickerPanel = dynamic(() => import("./EmojiPickerPanel"), {
  ssr: false,
});

const EMOJI_BUTTON_PX = 36;
const HORIZONTAL_CHROME_PX = 60;
const MIN_PER_LINE = 6;
const MAX_PER_LINE = 9;

function perLineForViewport() {
  const fit = Math.floor(
    (window.innerWidth - HORIZONTAL_CHROME_PX) / EMOJI_BUTTON_PX,
  );
  return Math.max(MIN_PER_LINE, Math.min(MAX_PER_LINE, fit));
}

interface EmojiPickerSheetProps {
  label: string;
  onPick: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiPickerSheet({
  label,
  onPick,
  onClose,
}: EmojiPickerSheetProps) {
  const [perLine] = useState(perLineForViewport);

  return (
    <BottomSheet label={label} onClose={onClose}>
      <div className="flex justify-center">
        <EmojiPickerPanel
          perLine={perLine}
          onPick={(emoji) => {
            onPick(emoji);
            onClose();
          }}
        />
      </div>
    </BottomSheet>
  );
}
