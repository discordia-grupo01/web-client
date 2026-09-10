"use client";

import { Eye, EyeOff } from "lucide-react";
import {
  forwardRef,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

import { TextField } from "./text-field";

interface PasswordFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label: string;
  icon?: ReactNode;
  error?: string;
}

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  function PasswordField({ label, icon, error, ...props }, ref) {
    const [visible, setVisible] = useState(false);

    return (
      <TextField
        ref={ref}
        label={label}
        icon={icon}
        error={error}
        type={visible ? "text" : "password"}
        trailing={
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Ocultar contrasena" : "Mostrar contrasena"}
            className="text-content-subtle hover:text-content-muted focus-visible:text-content-muted flex transition-colors focus-visible:outline-none"
          >
            {visible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        }
        {...props}
      />
    );
  },
);
