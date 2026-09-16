"use client";

import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/services/auth/auth-context";

export function LogoutButton() {
  const { logout, isLoggingOut } = useAuth();

  return (
    <Button
      type="button"
      variant="secondary"
      onClick={logout}
      isLoading={isLoggingOut}
      className="w-auto"
    >
      <LogOut size={16} />
      <span>Cerrar sesión</span>
    </Button>
  );
}
