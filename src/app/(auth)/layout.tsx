import type { ReactNode } from "react";

import { AuthBrandingPanel } from "@/components/auth/auth-branding-panel";
import { AppGoogleOAuthProvider } from "@/components/auth/google-oauth-provider";
import { ThemeToggle } from "@/components/ui/theme-toggle";

/** Shell split-screen para las pantallas de autenticacion. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-dvh w-full overflow-hidden">
      <AuthBrandingPanel />

      <div className="absolute top-3 right-3 z-20 sm:top-5 sm:right-5">
        <ThemeToggle />
      </div>

      <div className="bg-surface-sunken flex w-full shrink-0 flex-col items-center justify-center overflow-y-auto px-6 py-12 sm:px-8 lg:w-[480px]">
        <div className="w-full max-w-sm">
          <AppGoogleOAuthProvider>{children}</AppGoogleOAuthProvider>
        </div>
      </div>
    </div>
  );
}
