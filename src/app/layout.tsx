import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import type { ReactNode } from "react";

import { DEFAULT_THEME, themeToCss } from "@discordia/client-shared";

import { AuthProvider } from "@/services/auth/auth-context";
import { getCurrentUser } from "@/services/auth/session";
import { APP_NAME } from "@/lib/constants";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s · ${APP_NAME}`,
  },
  description:
    "Chat de texto, voz y video para comunidades de todos los tamanos.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const user = getCurrentUser();

  return (
    <html
      lang="es"
      data-theme={DEFAULT_THEME}
      className={`${inter.variable} ${outfit.variable}`}
    >
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeToCss() }} />
      </head>
      <body>
        <AuthProvider initialUser={user}>{children}</AuthProvider>
      </body>
    </html>
  );
}
