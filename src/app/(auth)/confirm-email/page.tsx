import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthLogo } from "@/components/auth/AuthLogo";
import { ConfirmEmailForm } from "@/components/auth/ConfirmEmailForm";

export const metadata: Metadata = {
  title: "Confirmar correo",
};

export default function ConfirmEmailPage() {
  return (
    <>
      <AuthLogo />
      <Suspense fallback={<ConfirmEmailSkeleton />}>
        <ConfirmEmailForm />
      </Suspense>
    </>
  );
}

function ConfirmEmailSkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      <div className="bg-surface-input h-16 w-16 rounded-2xl" />
      <div className="bg-surface-input h-8 w-3/4 rounded-xl" />
      <div className="bg-surface-input h-16 rounded-xl" />
      <div className="bg-surface-input h-11 rounded-xl" />
    </div>
  );
}
