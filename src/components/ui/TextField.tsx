import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

import { cn } from "@/lib/cn";

import { FieldLabel } from "./FieldLabel";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  /** Icono a la izquierda del input. */
  icon?: ReactNode;
  /** Contenido a la derecha (ej: boton mostrar/ocultar). */
  trailing?: ReactNode;
  error?: string;
  /** Muestra el asterisco rojo de campo obligatorio. */
  requiredMark?: boolean;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField(
    {
      label,
      icon,
      trailing,
      error,
      requiredMark = false,
      id,
      className,
      ...props
    },
    ref,
  ) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const errorId = `${inputId}-error`;

    return (
      <div>
        <FieldLabel
          htmlFor={inputId}
          required={requiredMark}
          className="mb-1.5"
        >
          {label}
        </FieldLabel>

        <div
          className={cn(
            "bg-surface-input flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
            "focus-within:border-accent",
            error ? "border-danger" : "border-line",
          )}
        >
          {icon ? (
            <span className="text-content-subtle shrink-0" aria-hidden="true">
              {icon}
            </span>
          ) : null}

          <input
            ref={ref}
            id={inputId}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className={cn(
              "text-content min-w-0 flex-1 border-none bg-transparent text-sm outline-none",
              "placeholder:text-content-subtle",
              className,
            )}
            {...props}
          />

          {trailing ? <span className="shrink-0">{trailing}</span> : null}
        </div>

        {error ? (
          <p id={errorId} className="text-danger mt-1.5 text-xs">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);
