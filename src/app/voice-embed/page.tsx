import type { Metadata } from "next";

import { VoiceEmbed } from "@/components/voice/VoiceEmbed";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * La llama el WebView invisible de app-mobile para correr LiveKit (Expo Go
 * no tiene el SDK nativo). No pide sesion: la app ya consiguio el token.
 */
export default function VoiceEmbedPage() {
  return <VoiceEmbed />;
}
