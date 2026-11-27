import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

interface FieldLabelProps {
  as?: "label" | "legend";
  htmlFor?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

export function FieldLabel({
  as: Tag = "label",
  htmlFor,
  required = false,
  className,
  children,
}: FieldLabelProps) {
  const classes = cn(
    "text-content-subtle block text-xs font-semibold tracking-wider uppercase",
    className,
  );
  const content = (
    <>
      {children}
      {required ? (
        <span className="text-danger" aria-hidden="true">
          {" "}
          *
        </span>
      ) : null}
    </>
  );

  return Tag === "legend" ? (
    <legend className={classes}>{content}</legend>
  ) : (
    <label htmlFor={htmlFor} className={classes}>
      {content}
    </label>
  );
}
