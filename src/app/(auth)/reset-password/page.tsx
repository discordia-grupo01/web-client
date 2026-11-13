import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthLogo } from "@/components/auth/AuthLogo";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Restablecer contraseña",
};

export default function ResetPasswordPage() {
  return (
    <>
      <AuthLogo />
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </>
  );
}
