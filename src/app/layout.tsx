import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import type { ReactNode } from "react";

import { AuthProvider } from "@/features/auth/auth-context";
import { getCurrentUser } from "@/features/auth/session";
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
      data-theme="dark"
      className={`${inter.variable} ${outfit.variable}`}
    >
      <body>
        <AuthProvider initialUser={user}>{children}</AuthProvider>
      </body>
    </html>
  );
}
