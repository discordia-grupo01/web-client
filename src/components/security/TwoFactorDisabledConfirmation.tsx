"use client";

import { CheckCircle } from "lucide-react";

import { Button } from "@/components/ui/Button";

interface TwoFactorDisabledConfirmationProps {
  onClose: () => void;
  onReactivate: () => void;
}

export function TwoFactorDisabledConfirmation({
  onClose,
  onReactivate,
}: TwoFactorDisabledConfirmationProps) {
  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="bg-success/15 text-success mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl">
          <CheckCircle size={32} />
        </div>
        <h3 className="text-content font-display text-xl font-bold">
          Verificación en dos pasos desactivada
        </h3>
        <p className="text-content-muted mx-auto mt-2 max-w-sm text-sm leading-relaxed">
          El cambio se guardó correctamente. A partir de ahora, tus próximos
          inicios de sesión solo requerirán la contraseña.
        </p>
      </div>

      <div className="bg-surface-raised border-line rounded-2xl border p-4">
        <p className="text-info text-sm font-semibold">
          Podés volver a activarla cuando quieras
        </p>
        <p className="text-content-muted mt-1 text-sm leading-relaxed">
          Necesitarás conectar nuevamente tu app autenticadora y guardar una
          nueva lista de códigos de recuperación.
        </p>
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cerrar
        </Button>
        <Button type="button" onClick={onReactivate}>
          Volver a activar
        </Button>
      </div>
    </div>
  );
}
