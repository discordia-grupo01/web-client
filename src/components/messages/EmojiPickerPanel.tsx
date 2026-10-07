"use client";

import i18n from "@emoji-mart/data/i18n/es.json";
import data from "@emoji-mart/data/sets/15/native.json";
import Picker from "@emoji-mart/react";

import { useTheme } from "@/hooks/useTheme";

interface EmojiPickerPanelProps {
  onPick: (emoji: string) => void;
}

export default function EmojiPickerPanel({ onPick }: EmojiPickerPanelProps) {
  const { theme } = useTheme();

  return (
    <Picker
      data={data}
      i18n={i18n}
      locale="es"
      set="native"
      theme={theme}
      previewPosition="none"
      skinTonePosition="search"
      onEmojiSelect={(emoji: { native: string }) => onPick(emoji.native)}
    />
  );
}
