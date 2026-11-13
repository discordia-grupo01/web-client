import type { Metadata } from "next";

import { AuthLogo } from "@/components/auth/AuthLogo";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Recuperar contraseña",
};

export default function ForgotPasswordPage() {
  return (
    <>
      <AuthLogo />
      <ForgotPasswordForm />
    </>
  );
}
