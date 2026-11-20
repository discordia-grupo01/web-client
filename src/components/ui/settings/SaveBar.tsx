import { Button } from "@/components/ui/Button";

interface SaveBarProps {
  isSaving: boolean;
  canSave?: boolean;
  onDiscard: () => void;
  /** Sin `onSave` el botón es `submit` del formulario que lo contiene. */
  onSave?: () => void;
  saveLabel?: string;
}

export function SaveBar({
  isSaving,
  canSave = true,
  onDiscard,
  onSave,
  saveLabel = "Guardar cambios",
}: SaveBarProps) {
  return (
    <div
      role="region"
      aria-label="Cambios sin guardar"
      className="border-line bg-surface-raised flex shrink-0 flex-wrap items-center justify-end gap-3 border-t px-4 py-3 sm:px-8"
    >
      <p className="text-content mr-auto text-sm font-semibold">
        Tenés cambios sin guardar
      </p>
      <Button
        type="button"
        variant="secondary"
        onClick={onDiscard}
        disabled={isSaving}
        className="w-auto px-4 py-2"
      >
        Descartar
      </Button>
      <Button
        type={onSave ? "button" : "submit"}
        onClick={onSave}
        disabled={!canSave || isSaving}
        isLoading={isSaving}
        className="w-auto px-4 py-2"
      >
        {saveLabel}
      </Button>
    </div>
  );
}
