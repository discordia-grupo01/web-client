import { ChevronDown, ChevronUp } from "lucide-react";
import { type InputHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

interface NumberFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "onChange" | "min" | "max"
> {
  value: string;
  onValueChange: (value: string) => void;
  min?: number;
  max?: number;
}

const STEP_BUTTON =
  "text-content-subtle hover:bg-surface-hover hover:text-content flex flex-1 cursor-pointer items-center justify-center transition-colors";

export function NumberField({
  value,
  onValueChange,
  min = 1,
  max,
  className,
  ...props
}: NumberFieldProps) {
  function step(delta: number) {
    const next = (Number.parseInt(value, 10) || 0) + delta;
    if (next < min) onValueChange("");
    else onValueChange(String(max === undefined ? next : Math.min(next, max)));
  }

  return (
    <div className={cn("relative min-w-0", className)}>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(event) =>
          onValueChange(event.target.value.replace(/\D/g, ""))
        }
        className="bg-surface-input border-line text-content placeholder:text-content-subtle focus:border-accent w-full rounded-xl border py-3 pr-11 pl-4 text-sm transition-colors outline-none"
        {...props}
      />
      <div className="absolute inset-y-1.5 right-1.5 flex w-7 flex-col overflow-hidden rounded-lg">
        <button
          type="button"
          tabIndex={-1}
          aria-label="Aumentar"
          onClick={() => step(1)}
          className={STEP_BUTTON}
        >
          <ChevronUp size={14} />
        </button>
        <button
          type="button"
          tabIndex={-1}
          aria-label="Disminuir"
          onClick={() => step(-1)}
          className={STEP_BUTTON}
        >
          <ChevronDown size={14} />
        </button>
      </div>
    </div>
  );
}
