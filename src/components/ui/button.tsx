import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  isLoading?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-gradient-to-br from-accent-gradient-start to-accent-gradient-end text-on-accent shadow-[0_6px_20px_rgba(36,92,107,0.4)] hover:brightness-110",
  secondary:
    "bg-surface-input text-content-muted border border-line hover:border-line-strong",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      isLoading = false,
      disabled,
      className,
      children,
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled ?? isLoading}
        aria-busy={isLoading}
        className={cn(
          "font-display inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all",
          "focus-visible:ring-accent focus-visible:ring-offset-surface-sunken focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
          "active:scale-[0.98] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60",
          VARIANTS[variant],
          className,
        )}
        {...props}
      >
        {isLoading ? (
          <span
            className="size-5 animate-spin rounded-full border-2 border-white/30 border-t-white"
            aria-hidden="true"
          />
        ) : (
          children
        )}
      </button>
    );
  },
);
