import { PROFILE_UNAVAILABLE } from "@discordia/client-shared";

import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/Button";

import { ProfileBanner } from "./ProfileBanner";

export function SuspendedProfile({ onClose }: { onClose: () => void }) {
  return (
    <>
      <ProfileBanner onClose={onClose} dimmed />
      <div className="flex flex-col items-center gap-3 px-6 py-8 text-center">
        <div className="bg-danger/10 border-danger/30 flex size-14 items-center justify-center rounded-full border">
          <AlertCircle size={26} className="text-danger" />
        </div>
        <h2 className="font-display text-content text-base font-bold">
          Perfil no disponible
        </h2>
        <p className="text-content-subtle max-w-[220px] text-sm leading-relaxed">
          {PROFILE_UNAVAILABLE} Es posible que la cuenta haya sido suspendida.
        </p>
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          className="mt-1 w-auto"
        >
          Cerrar
        </Button>
      </div>
    </>
  );
}
