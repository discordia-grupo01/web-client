import type { Metadata } from "next";
import type { ReactNode } from "react";

import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: APP_NAME,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
