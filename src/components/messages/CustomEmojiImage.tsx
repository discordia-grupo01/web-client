"use client";

import { emojiLabel } from "@discordia/client-shared";
import { useMemo } from "react";

import { useCustomEmoji } from "@/contexts/CustomEmojisContext";
import { useServerEmojiCatalog } from "@/contexts/ServerEmojisContext";
import { cn } from "@/lib/cn";
import { emojiImageSrc } from "@/utils/image-urls";

interface CustomEmojiImageProps {
  id: string;
  name: string;
  size?: number;
  className?: string;
}

export function CustomEmojiImage({
  id,
  name,
  size = 22,
  className,
}: CustomEmojiImageProps) {
  const customEmoji = useCustomEmoji(id);
  const { byServer } = useServerEmojiCatalog();

  const serverEmoji = useMemo(() => {
    if (customEmoji) return null;
    for (const emojis of Object.values(byServer)) {
      const match = emojis.find((item) => item.id === id);
      if (match) return match;
    }
    return null;
  }, [customEmoji, byServer, id]);

  const emoji = customEmoji ?? serverEmoji;
  const label = emojiLabel(name);

  if (!emoji) return <>{label}</>;

  return (
    // eslint-disable-next-line @next/next/no-img-element -- el host de la imagen lo decide el back (Supabase o el gateway)
    <img
      src={emojiImageSrc(emoji.image_url)}
      alt={label}
      title={label}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={cn("inline-block object-contain align-[-0.25em]", className)}
    />
  );
}
