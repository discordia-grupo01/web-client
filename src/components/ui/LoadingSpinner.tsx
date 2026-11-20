import { cn } from "@/lib/cn";

interface LoadingSpinnerProps {
  label?: string;
  className?: string;
}

export function LoadingSpinner({
  label = "Cargando",
  className,
}: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn("flex items-center justify-center py-10", className)}
    >
      <span
        aria-hidden
        className="border-line-strong border-t-accent size-6 animate-spin rounded-full border-2"
      />
    </div>
  );
}
