"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";
import { ROUTES } from "@/lib/constants";

const TABS = [
  { href: ROUTES.login, label: "Iniciar Sesión" },
  { href: ROUTES.register, label: "Crear Cuenta" },
] as const;

/**
 * Switch segmentado entre login y registro (esta en el diseno de Figma).
 * Cada opcion es un `<Link>` a su ruta real; el activo se resuelve por el
 * pathname actual.
 */
export function AuthModeToggle() {
  const pathname = usePathname();

  return (
    <div className="bg-surface-input mb-8 flex rounded-xl p-1">
      {TABS.map((tab) => {
        const isActive = pathname === tab.href;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "font-display flex-1 rounded-lg py-2 text-center text-sm font-semibold transition-all",
              isActive
                ? "bg-accent text-white shadow-[0_4px_12px_rgba(36,92,107,0.4)]"
                : "text-content-subtle hover:text-content-muted",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
