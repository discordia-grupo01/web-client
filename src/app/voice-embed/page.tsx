import type { Metadata } from "next";

import { VoiceEmbed } from "@/components/voice/VoiceEmbed";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * La carga el WebView de app-mobile para correr LiveKit (Expo Go no tiene el
 * SDK nativo) y dibujar la grilla de la llamada. No pide sesion: la app ya
 * consiguio el token.
 */
export default function VoiceEmbedPage() {
  return <VoiceEmbed />;
}
