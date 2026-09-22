import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";

import { ConfirmEmailForm } from "@/components/auth/confirm-email-form";

export const metadata: Metadata = {
  title: "Confirmar correo",
};

export default function ConfirmEmailPage() {
  return (
    <>
      <Image
        src="/logo-light.png"
        alt="discordia"
        width={1010}
        height={269}
        priority
        className="mb-8 h-auto w-48 lg:hidden"
      />
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
