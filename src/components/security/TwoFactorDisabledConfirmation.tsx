"use client";

import { CheckCircle } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { SettingsFormFooter } from "@/components/ui/settings/SettingsFormFooter";
import { SettingsStep } from "@/components/ui/settings/SettingsStep";

import { SECURITY_TITLE } from "./securityCopy";

interface TwoFactorDisabledConfirmationProps {
  onClose: () => void;
  onReactivate: () => void;
}

export function TwoFactorDisabledConfirmation({
  onClose,
  onReactivate,
}: TwoFactorDisabledConfirmationProps) {
  return (
    <SettingsStep
      parent={SECURITY_TITLE}
      title="Verificación en dos pasos desactivada"
      description="El cambio se guardó correctamente. A partir de ahora, tus próximos inicios de sesión solo requerirán la contraseña."
      onBack={onClose}
      footer={
        <SettingsFormFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="w-auto px-4 py-2"
          >
            Cerrar
          </Button>
          <Button
            type="button"
            onClick={onReactivate}
            className="w-auto px-4 py-2"
          >
            Volver a activar
          </Button>
        </SettingsFormFooter>
      }
    >
      <div className="bg-surface-raised border-line flex items-start gap-3 rounded-2xl border p-4">
        <CheckCircle size={18} className="text-success mt-0.5 shrink-0" />
        <div>
          <p className="text-info text-sm font-semibold">
            Podés volver a activarla cuando quieras
          </p>
          <p className="text-content-muted mt-1 text-sm leading-relaxed">
            Necesitarás conectar nuevamente tu app autenticadora y guardar una
            nueva lista de códigos de recuperación.
          </p>
        </div>
      </div>
    </SettingsStep>
  );
}
