import { AlertCircle } from "lucide-react";

/**
 * Error general de un formulario (el que no pertenece a ningun campo: red
 * caida, sesion vencida, permisos). No renderiza nada sin mensaje.
 */
export function FormAlert({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="border-danger/30 bg-danger/10 text-danger flex items-start gap-3 rounded-xl border px-4 py-3 text-sm"
    >
      <AlertCircle size={16} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
