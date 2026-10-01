interface CustomStatusBadgeProps {
  statusText: string;
  statusEmoji: string;
}

/**
 * Pill de solo lectura con el estado personalizado. No renderiza nada si
 * está vacío (CA2 de "Estado personalizado": sin texto configurado, no se
 * muestra nada).
 */
export function CustomStatusBadge({
  statusText,
  statusEmoji,
}: CustomStatusBadgeProps) {
  if (!statusText && !statusEmoji) return null;

  return (
    <div className="bg-surface-input flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs">
      {statusEmoji ? <span>{statusEmoji}</span> : null}
      {statusText ? (
        <span className="text-content-muted">{statusText}</span>
      ) : null}
    </div>
  );
}
