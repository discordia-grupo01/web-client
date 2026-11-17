"use client";

import {
  EMOJI_IMAGE_REQUIRED,
  normalizeEmojiName,
  type ServerEmoji,
  validateEmojiImage,
  validateEmojiName,
} from "@discordia/client-shared";
import { useCallback, useState } from "react";

import { uploadServerEmojiRequest } from "@/services/emojis/client";

export interface EmojiFieldErrors {
  name?: string;
  image?: string;
  form?: string;
}

export function useUploadEmoji(serverId: string) {
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<EmojiFieldErrors>({});

  const clearErrors = useCallback(() => setErrors({}), []);

  const upload = useCallback(
    async (name: string, file: File | null): Promise<ServerEmoji | null> => {
      if (file === null) {
        setErrors({ image: EMOJI_IMAGE_REQUIRED });
        return null;
      }

      const imageError = validateEmojiImage({
        mimeType: file.type,
        sizeBytes: file.size,
      });
      const nameError = validateEmojiName(name);
      if (imageError || nameError) {
        setErrors({ image: imageError, name: nameError });
        return null;
      }

      const formData = new FormData();
      formData.append("name", normalizeEmojiName(name));
      formData.append("image", file);

      setErrors({});
      setIsUploading(true);
      const result = await uploadServerEmojiRequest(serverId, formData);
      setIsUploading(false);

      if (!result.ok) {
        setErrors({ [result.field ?? "form"]: result.message });
        return null;
      }
      return result.emoji;
    },
    [serverId],
  );

  return { upload, isUploading, errors, clearErrors };
}
