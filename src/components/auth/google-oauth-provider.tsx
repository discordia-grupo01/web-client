"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import type { ReactNode } from "react";

/**
 * Boundary cliente para el SDK de Google Identity Services. El layout de
 * auth es Server Component, asi que este wrapper es el unico lugar que
 * necesita "use client" para exponer el contexto de `@react-oauth/google`
 * (lo consume `GoogleButton` via `<GoogleLogin>`).
 */
export function AppGoogleOAuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <GoogleOAuthProvider
      clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? ""}
    >
      {children}
    </GoogleOAuthProvider>
  );
}
