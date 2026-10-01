import { AlertCircle } from "lucide-react";

/** Error de un campo puntual del formulario. No renderiza nada sin mensaje. */
export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-danger mt-1.5 flex items-center gap-1.5 text-xs">
      <AlertCircle size={13} className="shrink-0" />
      <span>{message}</span>
    </p>
  );
}
